-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('individual', 'company', 'investor', 'promoter');

-- CreateEnum
CREATE TYPE "SpaceStatus" AS ENUM ('available', 'soon', 'reserved', 'rented', 'withdrawn');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('open', 'closed', 'discarded');

-- CreateEnum
CREATE TYPE "BudgetBasis" AS ENUM ('total', 'per_m2', 'market');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cif" TEXT,
    "current_address" TEXT,
    "status" TEXT,
    "procedencia" TEXT,
    "comments" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cif" TEXT,
    "owner_type" "OwnerType" NOT NULL,
    "address" TEXT,
    "postal_code" TEXT,
    "fee_terms" TEXT,
    "last_contacted_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ownership" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "share_pct" DECIMAL(5,2),

    CONSTRAINT "Ownership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "street_address" TEXT,
    "postal_code" TEXT,
    "zone" TEXT,
    "property_type" TEXT,
    "status" TEXT,
    "has_parking" BOOLEAN NOT NULL DEFAULT false,
    "parking_price" DECIMAL(10,2),
    "observations" TEXT,
    "consultancy_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultancy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cif" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consultancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "idealista_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "m2" DECIMAL(10,2),
    "terrace" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "floor_id" TEXT NOT NULL,
    "m2" DECIMAL(10,2) NOT NULL,
    "renta_m2" DECIMAL(10,2),
    "gastos_m2" DECIMAL(10,2),
    "ibi_m2" DECIMAL(10,2),
    "parking_spaces" INTEGER,
    "status" "SpaceStatus" NOT NULL DEFAULT 'available',
    "available_from" TIMESTAMP(3),
    "last_renovation" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "client_id" TEXT,
    "owner_id" TEXT,
    "floor_id" TEXT,
    "consultancy_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformationRequest" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "m2_min" DECIMAL(10,2),
    "m2_max" DECIMAL(10,2),
    "zones" TEXT[],
    "budget_min" DECIMAL(12,2),
    "budget_max" DECIMAL(12,2),
    "budget_basis" "BudgetBasis",
    "property_type" TEXT,
    "idealista_zone" TEXT,
    "target_date" TIMESTAMP(3),
    "interested_floor_id" TEXT,
    "interested_space_id" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'open',
    "requests_parking" BOOLEAN NOT NULL DEFAULT false,
    "comercial_id" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InformationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ownership_building_id_idx" ON "Ownership"("building_id");

-- CreateIndex
CREATE UNIQUE INDEX "Ownership_owner_id_building_id_key" ON "Ownership"("owner_id", "building_id");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- CreateIndex
CREATE INDEX "Floor_building_id_idx" ON "Floor"("building_id");

-- CreateIndex
CREATE INDEX "Space_floor_id_idx" ON "Space"("floor_id");

-- CreateIndex
CREATE INDEX "Contact_client_id_idx" ON "Contact"("client_id");

-- CreateIndex
CREATE INDEX "Contact_owner_id_idx" ON "Contact"("owner_id");

-- CreateIndex
CREATE INDEX "Contact_floor_id_idx" ON "Contact"("floor_id");

-- CreateIndex
CREATE INDEX "Contact_consultancy_id_idx" ON "Contact"("consultancy_id");

-- CreateIndex
CREATE INDEX "InformationRequest_client_id_request_date_idx" ON "InformationRequest"("client_id", "request_date");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_consultancy_id_fkey" FOREIGN KEY ("consultancy_id") REFERENCES "Consultancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_consultancy_id_fkey" FOREIGN KEY ("consultancy_id") REFERENCES "Consultancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformationRequest" ADD CONSTRAINT "InformationRequest_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformationRequest" ADD CONSTRAINT "InformationRequest_interested_floor_id_fkey" FOREIGN KEY ("interested_floor_id") REFERENCES "Floor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformationRequest" ADD CONSTRAINT "InformationRequest_interested_space_id_fkey" FOREIGN KEY ("interested_space_id") REFERENCES "Space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformationRequest" ADD CONSTRAINT "InformationRequest_comercial_id_fkey" FOREIGN KEY ("comercial_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformationRequest" ADD CONSTRAINT "InformationRequest_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Exactly one of client_id / owner_id / floor_id / consultancy_id must be set
-- on a Contact. Prisma cannot express this in schema.prisma (see plan
-- .kilo/plans/1792592993857-crm-db-schema.md, task 2)
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_exactly_one_parent_check" CHECK (
    CAST("client_id" IS NOT NULL AS int)
    + CAST("owner_id" IS NOT NULL AS int)
    + CAST("floor_id" IS NOT NULL AS int)
    + CAST("consultancy_id" IS NOT NULL AS int)
    = 1
);
