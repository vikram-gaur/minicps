#
# Useful reference for specs: http://odva.org/
#
# Bro's ENIP analyser
#

enum cmd_codes {
        NOP                           = 0x0000,
	LIST_SERVICES 	   	      = 0x0004,
	LIST_IDENTITY 	   	      = 0x0063,
	LIST_INTERFACES    	      = 0x0064,
	REGISTER_SESSION   	      = 0x0065,
	UNREGISTER_SESSION 	      = 0x0066,
	SEND_RR_DATA	   	      = 0x006F,
	SEND_UNIT_DATA 	   	      = 0x0070,
	INDICATE_STATUS    	      = 0x0072,
	CANCEL 		   	      = 0x0073,
	# Other values are Reserved for future usage or Reserved for legacy
};

enum err_codes {
     	SUCCESS 		      = 0x0000,
	INVALID_UNSUPPORTED_CMD       = 0x0001,
	INSUFFICIENT_MEMORY	      = 0x0002,
	INCORRECT_DATA		      = 0x0003,
	INVALID_SESSION_HANDLE	      = 0x0064,
	INVALID_LENGTH		      = 0x0065,
	UNSUPPORTED_PROTOCOL_REVISION = 0x0069,
	# Other values are Reserved for future usage or Reserved for legacy
};

type ENIP_PDU(is_orig: bool) = record {
	header: ENIP_Header;
	data: 	case is_orig of {
		     true  -> request:  ENIP_Request(header);
		     false -> response: ENIP_Response(header);
	};
} &byteorder=bigendian;

type ENIP_Header = record {
	cmd: uint16; 		     # Command identifier
	len: uint16; 		     # Length of everyting (header + data)
	sh:  uint32; 		     # Session handle
	st:  uint32; 		     # Status
	sc:  bytestring &length = 8; # Sender context
	opt: uint32;		     # Option flags
} &byteorder=bigendian;

type ENIP_Request(header: ENIP_Header) = case header.cmd of {
        NOP 		   -> nop: 		 NopRequest(header);
	LIST_SERVICES 	   -> listServices: 	 ListServicesRequest(header);
	LIST_IDENTITY 	   -> listIdentity: 	 ListIRequest(header);
	LIST_INTERFACES    -> listInterfaces: 	 ListIRequest(header);
	REGISTER_SESSION   -> registerSession: 	 RegisterSessionRequest(header);
	UNREGISTER_SESSION -> unregisterSession: ListServicesRequest(header);
	SEND_RR_DATA 	   -> sendRRData: 	 SendRRData(header);
	SEND_UNIT_DATA 	   -> sendUnitData: 	 SendUnitData(header);
# 	INDICATE_STATUS    -> indicateStatus: 	 IndicateStatusRequest(header);
# 	CANCEL 		   -> cancel: 		 CancelRequest(header);

	# All the rest
	default		   -> unknown:		 bytestring &restofdata;
}

type ENIP_Response(header: ENIP_Header) = case header.cmd of {
	LIST_SERVICES 	   -> listServices: 	 ListServicesResponse(header);
	LIST_IDENTITY 	   -> listIdentity: 	 ListIResponse(header);
	LIST_INTERFACES    -> listInterfaces: 	 ListIResponse(header);
	REGISTER_SESSION   -> registerSession: 	 RegisterSessionResponse(header);
	SEND_RR_DATA 	   -> sendRRData: 	 SendRRData(header);
# 	INDICATE_STATUS    -> indicateStatus: 	 IndicateStatusResponse(header);
# 	CANCEL 		   -> cancel: 		 CancelResponse(header);

	# All the rest
	default		   -> unknown:		 bytestring &restofdata;
};

# REQUEST CMD=0
type NopRequest(header: ENIP_Header) = record {
        unused: bytestring &restofdata
	&check(header.st  == 0)
	&check(header.opt == 0);
};

# RESPONSE CMD=0
# No reply shall be generated by this command

# REQUEST CMD=1 || CMD=2
type ListIRequest(header: ENIP_Header) = record {
        unused: bytestring &restofdata
	&check(header.len == 0)
	&check(header.st  == 0)
	&check(header.sc  == 0)
	&check(header.opt == 0);
};

# RESPONSE CMD=1 or CMD=2
type ListIResponse(header: ENIP_Header) = record {
        item_count:    uint16;
	struct_of_tab: bytestring &restofdata
	&check(header.len == 0)
	&check(header.st  == 0)
	&check(header.sc  == 0)
	&check(header.opt == 0);
# Struct :
  # Type (uint16)
  # Len (uint16)
  # Array (bytes)
   # Item Type Code UINT Code indicating item type of CIP Identity (0x0C)
   # Item Length UINT Number of bytes in item which follow (length varies
   # depending on Product Name string)
   # Encapsulation Protocol
   # Version UINT Encapsulation Protocol Version supported (also returned
   # with Register Sesstion reply).
   # Socket Address STRUCT of Socket Address (see section 2-6.3.2)
   # INT sin_family (big-endian)
   # UINT sin_port (big-endian)
   # UDINT sin_addr (big-endian)
   # ARRAY of USINT sin_zero (length of 8) (big-endian)
   # Vendor ID1 UINT Device manufacturers Vendor ID
   # Device Type1 UINT Device Type of product
   # Product Code1 UINT Product Code assigned with respect to device type
   # Revision1 USINT[2] Device revision
   # Status1 WORD Current status of device
   # Serial Number1 UDINT Serial number of device
   # Product Name1 SHORT_STRING Human readable description of device
   # State1 USINT Current state of device
};

# REQUEST CMD=3
type ListServicesRequest(header: ENIP_Header) = record {
        unused: bytestring &restofdata
	&check(header.len  == 0)
	&check(header.st   == 0)
	&check(header.opt  == 0);
};
# RESPONSE CMD=3
type ListServicesResponse(header: ENIP_Header) = record {
        item_count: uint16;
	struct_of_tab: bytestring &restofdata
	&check(header.st  == 0)
	&check(header.opt == 0);
	# Target Items STRUCT of Interface Information
	  # UINT Item Type Code
	  # UINT Item Length
	  # UINT Version of encapsulated protocol shall be
	  # set to 1
	  # UINT Capability flags
	  # ARRAY of 16 USINT Name of service
};

type RegisterSessionRequest(header: ENIP_Header) = record {
        protocol: uint16 &check(protocol  == 0x01);
	options:  uint16 &check(options   == 0x00)
	&check(header.sh  == 0)
	&check(header.st  == 0)
	&check(header.opt == 0);
};

type RegisterSessionResponse(header: ENIP_Header) = record {
        protocol: uint16 &check(protocol  == 0x01);
	options:  uint16 &check(options   == 0x00)
	&check(header.st  == 0)
	&check(header.opt == 0);
};

type SendRRData(header: ENIP_Header) = record {
        iface_handle:  uint32 &check(iface_handle == 0);
	timeout:       uint16;
	struct_of_tab: bytestring &restofdata
	&check(header.st  == 0)
	&check(header.opt == 0);
# Struct :
  # Type (uint16)
  # Len (uint16)
  # Array (bytes)
   # Item Type Code UINT Code indicating item type of CIP Identity (0x0C)
   # Item Length UINT Number of bytes in item which follow (length varies
   # depending on Product Name string)
   # Encapsulation Protocol
   # Version UINT Encapsulation Protocol Version supported (also returned
   # with Register Sesstion reply).
   # Socket Address STRUCT of Socket Address (see section 2-6.3.2)
   # INT sin_family (big-endian)
   # UINT sin_port (big-endian)
   # UDINT sin_addr (big-endian)
   # ARRAY of USINT sin_zero (length of 8) (big-endian)
   # Vendor ID1 UINT Device manufacturers Vendor ID
   # Device Type1 UINT Device Type of product
   # Product Code1 UINT Product Code assigned with respect to device type
   # Revision1 USINT[2] Device revision
   # Status1 WORD Current status of device
   # Serial Number1 UDINT Serial number of device
   # Product Name1 SHORT_STRING Human readable description of device
   # State1 USINT Current state of device
};

type SendUnitData(header: ENIP_Header) = record {
        iface_handle:  uint32 &check(iface_handle == 0);
	timeout:       uint16 &check(timeout      == 0);
	struct_of_tab: bytestring &restofdata
	&check(header.st  == 0)
	&check(header.opt == 0);
# Struct :
  # Type (uint16)
  # Len (uint16)
  # Array (bytes)
   # Item Type Code UINT Code indicating item type of CIP Identity (0x0C)
   # Item Length UINT Number of bytes in item which follow (length varies
   # depending on Product Name string)
   # Encapsulation Protocol
   # Version UINT Encapsulation Protocol Version supported (also returned
   # with Register Sesstion reply).
   # Socket Address STRUCT of Socket Address (see section 2-6.3.2)
   # INT sin_family (big-endian)
   # UINT sin_port (big-endian)
   # UDINT sin_addr (big-endian)
   # ARRAY of USINT sin_zero (length of 8) (big-endian)
   # Vendor ID1 UINT Device manufacturers Vendor ID
   # Device Type1 UINT Device Type of product
   # Product Code1 UINT Product Code assigned with respect to device type
   # Revision1 USINT[2] Device revision
   # Status1 WORD Current status of device
   # Serial Number1 UDINT Serial number of device
   # Product Name1 SHORT_STRING Human readable description of device
   # State1 USINT Current state of device
};