-- ==========================================
-- 1. CRÉATION DES TYPES ENUM (PostgreSQL)
-- ==========================================
CREATE TYPE severity AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE offer_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAW');
CREATE TYPE meeting_type AS ENUM ('PROPERTY_VISIT', 'PHONE_CALL', 'OFFICE_APPOINTMENT', 'CONTRACT_SIGNING');
CREATE TYPE meeting_status AS ENUM ('SCHEDULED', 'PENDING', 'IN_PROGRESS', 'RESCHEDULED', 'POSTPONED', 'CANCELED', 'COMPLETED', 'MISSED', 'DRAFT');
CREATE TYPE interaction_type AS ENUM ('CALL', 'VISIT', 'EMAIL', 'MEETING', 'NOTE', 'SYSTEM');
CREATE TYPE flag_type AS ENUM ('MISSING_SECTION', 'UNUSUAL_CLAUSE', 'INCONSISTENCY', 'OTHER');
CREATE TYPE document_type AS ENUM ('INCOM_CERT', 'BANK_STATMENT', 'NATIONAL_ID', 'PROOF_OF_ADDRESS', 'CONTRACT_SIGNED', 'OTHER');
CREATE TYPE deal_stage AS ENUM ('COLD', 'WARM', 'HOT', 'NEGOTIATION', 'CLOSED', 'LOST');
CREATE TYPE contract_status AS ENUM ('DRAFT', 'SENT', 'RECEIVED_SIGNED', 'ARCHIVED');
CREATE TYPE client_status AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');
CREATE TYPE folder_status AS ENUM ('PENDING', 'ACTIVE');
CREATE TYPE client_type AS ENUM ('BUYER', 'SELLER');


-- ==========================================
-- 2. INSERTION DES TYPES DE PROPRIÉTÉS
-- ==========================================
-- Residential Properties
INSERT INTO property_types (id_property_type, general_type, specific_type, description, created_at, updated_at) VALUES 
(gen_random_uuid(), 'Residential Properties', 'Apartment / Flat', 'Unit within a larger building', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Residential Properties', 'House', 'Detached, semi-detached, or townhouse', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Residential Properties', 'Studio', 'Single room combining living, bedroom, and kitchenette', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Residential Properties', 'Duplex / Triplex', 'Apartment or house with two or three levels', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Residential Properties', 'Penthouse', 'Top-floor apartment with luxury features', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Residential Properties', 'Villa', 'Large, luxurious detached house with land', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Residential Properties', 'Mansion', 'Very large, imposing house', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Residential Properties', 'Cottage', 'Small, cozy house, often rural', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Residential Properties', 'Farmhouse', 'Agricultural property with land', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Residential Properties', 'Tiny House', 'Small, often mobile dwelling', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Commercial Properties
INSERT INTO property_types (id_property_type, general_type, specific_type, description, created_at, updated_at) VALUES 
(gen_random_uuid(), 'Commercial Properties', 'Retail Store / Shop', 'Commercial unit for selling goods', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Commercial Properties', 'Office Space', 'For professional or administrative work', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Commercial Properties', 'Restaurant / Café', 'Food and beverage service premises', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Commercial Properties', 'Warehouse', 'Storage or logistics facility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Commercial Properties', 'Industrial Building', 'Factory or manufacturing site', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Commercial Properties', 'Hotel', 'Accommodation for travelers', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Commercial Properties', 'Mixed-Use Building', 'Combination of residential and commercial units', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Special Purpose Properties
INSERT INTO property_types (id_property_type, general_type, specific_type, description, created_at, updated_at) VALUES 
(gen_random_uuid(), 'Special Purpose Properties', 'Parking Space / Garage', 'Individual or multi-unit parking', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Special Purpose Properties', 'Storage Unit', 'Self-storage facility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Special Purpose Properties', 'Medical / Dental Office', 'Healthcare professional space', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Special Purpose Properties', 'School / Daycare', 'Educational facilities', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Special Purpose Properties', 'Religious Building', 'Church, mosque, temple', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Special Purpose Properties', 'Multi-Family Building', 'Apartment building with several rental units', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Land
INSERT INTO property_types (id_property_type, general_type, specific_type, description, created_at, updated_at) VALUES 
(gen_random_uuid(), 'Land', 'Residential Land', 'For building houses or apartments', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Land', 'Commercial Land', 'For retail, office, or industrial development', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Land', 'Agricultural Land', 'For farming, crops, or livestock', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Land', 'Vacant Land', 'Undeveloped plot with no specified use', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- 3. ÉNUMÉRATIONS (Auth, Notification, etc.)
-- ==========================================
CREATE TYPE role AS ENUM ('ADMIN', 'AGENT');
CREATE TYPE deletion_reason AS ENUM ('LEFT_AGENCY', 'ACCOUNT_VIOLATION', 'OTHER');
CREATE TYPE sender_type AS ENUM ('CLIENT', 'INTERNAL_USER', 'SYSTEM');
