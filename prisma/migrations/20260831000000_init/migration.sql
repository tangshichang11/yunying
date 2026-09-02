-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RegionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "HotelStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HOTEL_MANAGER', 'REGIONAL_DIRECTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DailyOperationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REJECTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "AnomalyType" AS ENUM ('REVENUE', 'COST');

-- CreateEnum
CREATE TYPE "AnomalySeverity" AS ENUM ('WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "AnomalyStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'SUBMIT', 'APPROVE', 'REJECT');

-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('ROOM_SUPPLIES', 'FRONT_DESK_ITEMS', 'MERCHANDISE', 'RESTAURANT');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('VARIABLE', 'LABOR', 'COMMISSION', 'FIXED');

-- CreateEnum
CREATE TYPE "AllocationMethod" AS ENUM ('ROOM_COUNT', 'DAILY_USAGE', 'MANUAL');

-- CreateEnum
CREATE TYPE "ConfigStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RoomCountType" AS ENUM ('TOTAL', 'AVAILABLE', 'OCCUPIED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "OrgStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RegionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "actualRooms" INTEGER NOT NULL,
    "status" "HotelStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "hotelId" TEXT,
    "regionId" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_operations" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "status" "DailyOperationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "submissionDeadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenues" (
    "id" TEXT NOT NULL,
    "dailyOperationId" TEXT NOT NULL,
    "roomRevenue" DECIMAL(12,2) NOT NULL,
    "minibarRevenue" DECIMAL(12,2) NOT NULL,
    "foodRevenue" DECIMAL(12,2) NOT NULL,
    "otherRevenue" DECIMAL(12,2) NOT NULL,
    "totalRevenue" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variable_costs" (
    "id" TEXT NOT NULL,
    "dailyOperationId" TEXT NOT NULL,
    "roomSuppliesCost" DECIMAL(12,2) NOT NULL,
    "frontDeskItemsCost" DECIMAL(12,2) NOT NULL,
    "merchandiseCost" DECIMAL(12,2) NOT NULL,
    "laundryCost" DECIMAL(12,2) NOT NULL,
    "restaurantCost" DECIMAL(12,2) NOT NULL,
    "otherVariableCost" DECIMAL(12,2) NOT NULL,
    "totalVariableCost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variable_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labor_costs" (
    "id" TEXT NOT NULL,
    "dailyOperationId" TEXT NOT NULL,
    "frontDeskWages" DECIMAL(12,2) NOT NULL,
    "housekeepingWages" DECIMAL(12,2) NOT NULL,
    "restaurantWages" DECIMAL(12,2) NOT NULL,
    "managementWages" DECIMAL(12,2) NOT NULL,
    "totalLaborCost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labor_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_costs" (
    "id" TEXT NOT NULL,
    "dailyOperationId" TEXT NOT NULL,
    "reviewCommission" DECIMAL(12,2) NOT NULL,
    "qrCommission" DECIMAL(12,2) NOT NULL,
    "memberCardCommission" DECIMAL(12,2) NOT NULL,
    "housekeepingCommission" DECIMAL(12,2) NOT NULL,
    "totalCommissionCost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_costs" (
    "id" TEXT NOT NULL,
    "dailyOperationId" TEXT NOT NULL,
    "rent" DECIMAL(12,2) NOT NULL,
    "platformPromotionFee" DECIMAL(12,2) NOT NULL,
    "otherFixedCost" DECIMAL(12,2) NOT NULL,
    "totalFixedCost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energies" (
    "id" TEXT NOT NULL,
    "dailyOperationId" TEXT NOT NULL,
    "electricityConsumption" DECIMAL(12,4) NOT NULL,
    "electricityUnitPrice" DECIMAL(10,4) NOT NULL,
    "electricityCost" DECIMAL(12,2) NOT NULL,
    "waterConsumption" DECIMAL(12,4) NOT NULL,
    "waterUnitPrice" DECIMAL(10,4) NOT NULL,
    "waterCost" DECIMAL(12,2) NOT NULL,
    "gasConsumption" DECIMAL(12,4) NOT NULL,
    "gasUnitPrice" DECIMAL(10,4) NOT NULL,
    "gasCost" DECIMAL(12,2) NOT NULL,
    "totalUtilityCost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculation_results" (
    "id" TEXT NOT NULL,
    "dailyOperationId" TEXT NOT NULL,
    "totalRevenue" DECIMAL(12,2) NOT NULL,
    "totalVariableCost" DECIMAL(12,2) NOT NULL,
    "totalLaborCost" DECIMAL(12,2) NOT NULL,
    "totalCommissionCost" DECIMAL(12,2) NOT NULL,
    "totalFixedCost" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "gop" DECIMAL(12,2) NOT NULL,
    "gopRate" DECIMAL(8,6) NOT NULL,
    "occupancyRate" DECIMAL(8,6) NOT NULL,
    "avgRoomRate" DECIMAL(12,2) NOT NULL,
    "revpar" DECIMAL(12,2) NOT NULL,
    "isRevenueAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "isCostAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "calculationVersion" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calculation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomalies" (
    "id" TEXT NOT NULL,
    "dailyOperationId" TEXT NOT NULL,
    "calculationResultId" TEXT NOT NULL,
    "type" "AnomalyType" NOT NULL,
    "severity" "AnomalySeverity" NOT NULL,
    "expectedValue" DECIMAL(12,2) NOT NULL,
    "actualValue" DECIMAL(12,2) NOT NULL,
    "deviation" DECIMAL(12,2) NOT NULL,
    "deviationRate" DECIMAL(8,6) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AnomalyStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "operatorId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InventoryCategory" NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,4) NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "dailyOperationId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitPrice" DECIMAL(10,4) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_targets" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "revenueTarget" DECIMAL(12,2) NOT NULL,
    "costTarget" DECIMAL(12,2) NOT NULL,
    "gopTarget" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_targets" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "revenueTarget" DECIMAL(12,2) NOT NULL,
    "costTarget" DECIMAL(12,2) NOT NULL,
    "gopTarget" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_targets" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "revenueTarget" DECIMAL(12,2) NOT NULL,
    "costTarget" DECIMAL(12,2) NOT NULL,
    "gopTarget" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "management_fees" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "monthlyTarget" DECIMAL(12,2) NOT NULL,
    "managementFeeRate" DECIMAL(8,6) NOT NULL,
    "monthlyManagementFee" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "management_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_category_mappings" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT,
    "sourceSheet" TEXT NOT NULL,
    "sourceField" TEXT NOT NULL,
    "costCategory" "CostCategory" NOT NULL,
    "costSubCategory" TEXT NOT NULL,
    "allocationMethod" "AllocationMethod" NOT NULL,
    "status" "ConfigStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_category_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation_configs" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "costCategory" "CostCategory" NOT NULL,
    "costSubCategory" TEXT NOT NULL,
    "allocationMethod" "AllocationMethod" NOT NULL,
    "roomCountType" "RoomCountType",
    "manualValue" DECIMAL(12,2),
    "manualRatio" DECIMAL(8,6),
    "status" "ConfigStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocation_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regions_organizationId_idx" ON "regions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "hotels_code_key" ON "hotels"("code");

-- CreateIndex
CREATE INDEX "hotels_regionId_idx" ON "hotels"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_hotelId_idx" ON "users"("hotelId");

-- CreateIndex
CREATE INDEX "users_regionId_idx" ON "users"("regionId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "daily_operations_hotelId_idx" ON "daily_operations"("hotelId");

-- CreateIndex
CREATE INDEX "daily_operations_businessDate_idx" ON "daily_operations"("businessDate");

-- CreateIndex
CREATE INDEX "daily_operations_status_idx" ON "daily_operations"("status");

-- CreateIndex
CREATE INDEX "daily_operations_hotelId_status_idx" ON "daily_operations"("hotelId", "status");

-- CreateIndex
CREATE INDEX "daily_operations_hotelId_businessDate_idx" ON "daily_operations"("hotelId", "businessDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_operations_hotelId_businessDate_key" ON "daily_operations"("hotelId", "businessDate");

-- CreateIndex
CREATE UNIQUE INDEX "revenues_dailyOperationId_key" ON "revenues"("dailyOperationId");

-- CreateIndex
CREATE UNIQUE INDEX "variable_costs_dailyOperationId_key" ON "variable_costs"("dailyOperationId");

-- CreateIndex
CREATE UNIQUE INDEX "labor_costs_dailyOperationId_key" ON "labor_costs"("dailyOperationId");

-- CreateIndex
CREATE UNIQUE INDEX "commission_costs_dailyOperationId_key" ON "commission_costs"("dailyOperationId");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_costs_dailyOperationId_key" ON "fixed_costs"("dailyOperationId");

-- CreateIndex
CREATE UNIQUE INDEX "energies_dailyOperationId_key" ON "energies"("dailyOperationId");

-- CreateIndex
CREATE UNIQUE INDEX "calculation_results_dailyOperationId_key" ON "calculation_results"("dailyOperationId");

-- CreateIndex
CREATE INDEX "anomalies_dailyOperationId_idx" ON "anomalies"("dailyOperationId");

-- CreateIndex
CREATE INDEX "anomalies_calculationResultId_idx" ON "anomalies"("calculationResultId");

-- CreateIndex
CREATE INDEX "anomalies_status_idx" ON "anomalies"("status");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_operatorId_idx" ON "audit_logs"("operatorId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_timestamp_idx" ON "audit_logs"("entityType", "entityId", "timestamp");

-- CreateIndex
CREATE INDEX "inventory_items_hotelId_idx" ON "inventory_items"("hotelId");

-- CreateIndex
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_hotelId_code_key" ON "inventory_items"("hotelId", "code");

-- CreateIndex
CREATE INDEX "inventory_transactions_hotelId_idx" ON "inventory_transactions"("hotelId");

-- CreateIndex
CREATE INDEX "inventory_transactions_inventoryItemId_idx" ON "inventory_transactions"("inventoryItemId");

-- CreateIndex
CREATE INDEX "inventory_transactions_dailyOperationId_idx" ON "inventory_transactions"("dailyOperationId");

-- CreateIndex
CREATE INDEX "inventory_transactions_date_idx" ON "inventory_transactions"("date");

-- CreateIndex
CREATE INDEX "monthly_targets_hotelId_idx" ON "monthly_targets"("hotelId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_targets_hotelId_yearMonth_key" ON "monthly_targets"("hotelId", "yearMonth");

-- CreateIndex
CREATE INDEX "weekly_targets_hotelId_idx" ON "weekly_targets"("hotelId");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_targets_hotelId_yearMonth_weekNumber_key" ON "weekly_targets"("hotelId", "yearMonth", "weekNumber");

-- CreateIndex
CREATE INDEX "daily_targets_hotelId_idx" ON "daily_targets"("hotelId");

-- CreateIndex
CREATE INDEX "daily_targets_businessDate_idx" ON "daily_targets"("businessDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_targets_hotelId_businessDate_key" ON "daily_targets"("hotelId", "businessDate");

-- CreateIndex
CREATE INDEX "management_fees_hotelId_idx" ON "management_fees"("hotelId");

-- CreateIndex
CREATE UNIQUE INDEX "management_fees_hotelId_yearMonth_key" ON "management_fees"("hotelId", "yearMonth");

-- CreateIndex
CREATE INDEX "cost_category_mappings_hotelId_idx" ON "cost_category_mappings"("hotelId");

-- CreateIndex
CREATE INDEX "cost_category_mappings_sourceSheet_idx" ON "cost_category_mappings"("sourceSheet");

-- CreateIndex
CREATE UNIQUE INDEX "cost_category_mappings_hotelId_sourceSheet_sourceField_key" ON "cost_category_mappings"("hotelId", "sourceSheet", "sourceField");

-- CreateIndex
CREATE INDEX "allocation_configs_hotelId_idx" ON "allocation_configs"("hotelId");

-- CreateIndex
CREATE INDEX "allocation_configs_costCategory_idx" ON "allocation_configs"("costCategory");

-- CreateIndex
CREATE UNIQUE INDEX "allocation_configs_hotelId_costCategory_costSubCategory_key" ON "allocation_configs"("hotelId", "costCategory", "costSubCategory");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_operations" ADD CONSTRAINT "daily_operations_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_dailyOperationId_fkey" FOREIGN KEY ("dailyOperationId") REFERENCES "daily_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variable_costs" ADD CONSTRAINT "variable_costs_dailyOperationId_fkey" FOREIGN KEY ("dailyOperationId") REFERENCES "daily_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labor_costs" ADD CONSTRAINT "labor_costs_dailyOperationId_fkey" FOREIGN KEY ("dailyOperationId") REFERENCES "daily_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_costs" ADD CONSTRAINT "commission_costs_dailyOperationId_fkey" FOREIGN KEY ("dailyOperationId") REFERENCES "daily_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_costs" ADD CONSTRAINT "fixed_costs_dailyOperationId_fkey" FOREIGN KEY ("dailyOperationId") REFERENCES "daily_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energies" ADD CONSTRAINT "energies_dailyOperationId_fkey" FOREIGN KEY ("dailyOperationId") REFERENCES "daily_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculation_results" ADD CONSTRAINT "calculation_results_dailyOperationId_fkey" FOREIGN KEY ("dailyOperationId") REFERENCES "daily_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_dailyOperationId_fkey" FOREIGN KEY ("dailyOperationId") REFERENCES "daily_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_calculationResultId_fkey" FOREIGN KEY ("calculationResultId") REFERENCES "calculation_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_dailyOperationId_fkey" FOREIGN KEY ("dailyOperationId") REFERENCES "daily_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_targets" ADD CONSTRAINT "monthly_targets_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_targets" ADD CONSTRAINT "weekly_targets_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_targets" ADD CONSTRAINT "daily_targets_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "management_fees" ADD CONSTRAINT "management_fees_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_configs" ADD CONSTRAINT "allocation_configs_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
