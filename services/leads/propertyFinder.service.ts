import { api } from '@/services/api/client';

export interface PropertyFinderDetailsResponse {
  data: {
    leadId: string;
    externalLeadId?: string;
    webhookPayload: any;
    listingDetails: any;
    fields: PropertyFinderFields;
  };
}

export interface PropertyFinderFields {
  // Lead Information
  leadId: string;
  leadName?: string;
  mobileNumber?: string;
  email?: string;
  channel?: string;
  status?: string;
  inquiryDate?: string;
  entityType?: string;
  responseLink?: string;
  
  // Property Information
  propertyTitle?: string;
  propertyDescription?: string;
  listingId?: string;
  propertyReference?: string;
  propertyType?: string;
  propertyCategory?: string;
  price?: number;
  priceType?: string;
  currency: string;
  bedrooms?: string;
  bathrooms?: string;
  area?: number;
  areaUnit: string;
  furnishedStatus?: string;
  completionStatus?: string;
  permitNumber?: string;
  amenities: string[];
  
  // Location Information
  locationId?: number;
  emirate?: string;
  city?: string;
  communityName?: string;
  buildingName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  locationHierarchy?: string;
  
  // Unit Details
  unitNumber?: string;
  floorNumber?: string;
  parkingSlots?: number;
  availableFrom?: string;
  
  // Media
  images: any[];
  mainImage?: string;
  imageGallery: string[];
  floorPlan?: string;
  virtualTour?: string;
  video?: string;
  
  // Agent Information
  agentName?: string;
  agentEmail?: string;
  agentMobile?: string;
  agentId?: number;
  agencyName?: string;
  agencyLicense?: string;
  
  // Listing Details
  listingStatus?: string;
  publishedAt?: string;
  lastUpdatedAt?: string;
  verificationStatus?: string;
  qualityScore?: number;
  
  // URLs
  propertyFinderUrl?: string;
  listingUrl?: string;
  
  // Additional Fields
  createdAt?: string;
  updatedAt?: string;
  compliance?: any;
  products?: any;
  portals?: any;
}

export async function getPropertyFinderDetails(leadId: string) {
  const response = await api.get<PropertyFinderDetailsResponse>(`/leads/${leadId}/property-details`);
  return response.data;
}
