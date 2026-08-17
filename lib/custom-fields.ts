export const CUSTOM_FIELD_MAPPING_PREFIX = "custom:";

export function toCustomMappingKey(key: string): string {
  return key.startsWith(CUSTOM_FIELD_MAPPING_PREFIX)
    ? key
    : `${CUSTOM_FIELD_MAPPING_PREFIX}${key}`;
}

export function fromCustomMappingKey(mappingKey: string): string {
  return mappingKey.startsWith(CUSTOM_FIELD_MAPPING_PREFIX)
    ? mappingKey.slice(CUSTOM_FIELD_MAPPING_PREFIX.length)
    : mappingKey;
}

export function isCustomMappingKey(key: string): boolean {
  return key.startsWith(CUSTOM_FIELD_MAPPING_PREFIX) && key.length > CUSTOM_FIELD_MAPPING_PREFIX.length;
}
