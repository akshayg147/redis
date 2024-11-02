const redis_main_const = {
	REDIS_MAGIC_STRING: 5,
	REDIS_VERSION: 4,
};

const OPCODES = {
	EOF: 0xff,
	SELECTDB: 0xfe,
	EXPIRETIME: 0xfd,
	EXPIRETIMEMS: 0xfc,
	RESIZEDB: 0xfb,
	AUX: 0xfa,
};

const TYPES = {
    STRING: 0x00,       // Simple string
    LIST: 0x01,         // List
    SET: 0x02,          // Set
    HASH: 0x03,         // Hash map
    ZSET: 0x04,         // Sorted set
    COMPRESSED_STRING: 0x0c // Compressed string
};

module.exports = {
	redis_main_const,
	OPCODES,
    TYPES
};