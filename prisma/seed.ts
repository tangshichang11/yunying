import { PrismaClient, DailyOperationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: '慧友酒店集团',
      status: 'ACTIVE',
    },
  });
  console.log('Created organization:', org.name);

  // Create region
  const region = await prisma.region.create({
    data: {
      name: '龙口区域',
      organizationId: org.id,
      status: 'ACTIVE',
    },
  });
  console.log('Created region:', region.name);

  // Create hotel
  const hotel = await prisma.hotel.create({
    data: {
      name: '龙口悦致酒店',
      code: 'LK-YZ-001',
      physicalRoomCount: 120,
      regionId: region.id,
      status: 'ACTIVE',
    },
  });
  console.log('Created hotel:', hotel.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      name: '系统管理员',
      email: 'admin@huiyou.com',
      password: hashedPassword,
      role: 'ADMIN',
      hotelId: hotel.id,
      regionId: region.id,
      status: 'ACTIVE',
    },
  });
  console.log('Created admin user (username: admin, password: admin123)');

  // Create regional director user
  const directorPassword = await bcrypt.hash('director123', 10);
  const regionalDirector = await prisma.user.create({
    data: {
      username: 'director',
      name: '李总监',
      email: 'li.director@huiyou.com',
      password: directorPassword,
      role: 'REGIONAL_DIRECTOR',
      regionId: region.id,
      status: 'ACTIVE',
    },
  });
  console.log('Created regional director (username: director, password: director123)');

  // Create hotel manager user
  const managerPassword = await bcrypt.hash('manager123', 10);
  const hotelManager = await prisma.user.create({
    data: {
      username: 'manager',
      name: '张店长',
      email: 'zhang.manager@huiyou.com',
      password: managerPassword,
      role: 'HOTEL_MANAGER',
      hotelId: hotel.id,
      regionId: region.id,
      status: 'ACTIVE',
    },
  });
  console.log('Created hotel manager (username: manager, password: manager123)');

  // Create monthly target for September 2026
  const monthlyTarget = await prisma.monthlyTarget.create({
    data: {
      hotelId: hotel.id,
      yearMonth: '2026-09',
      revenueTarget: 960000,
      costTarget: 720000,
      gopTarget: 240000,
    },
  });
  console.log('Created monthly target for September');

  // Create daily targets for September 2026
  const daysInSeptember = 30;
  for (let day = 1; day <= daysInSeptember; day++) {
    const businessDate = new Date(2026, 8, day); // September = month 8 (0-indexed)
    await prisma.dailyTarget.create({
      data: {
        hotelId: hotel.id,
        businessDate,
        revenueTarget: 32000,
        costTarget: 24000,
        gopTarget: 8000,
      },
    });
  }
  console.log('Created daily targets for September');

  // Create daily operations for September 2026 (first 5 days)
  for (let day = 1; day <= 5; day++) {
    const businessDate = new Date(Date.UTC(2026, 8, day));
    const status: DailyOperationStatus = day <= 2 ? 'APPROVED' : day === 3 ? 'SUBMITTED' : 'DRAFT';

    const dailyOp = await prisma.dailyOperation.create({
      data: {
        hotelId: hotel.id,
        businessDate,
        status,
        submittedAt: day <= 3 ? new Date(Date.UTC(2026, 8, day, 4, 0, 0)) : null,
        submittedBy: day <= 3 ? hotelManager.id : null,
        reviewedAt: day <= 2 ? new Date(Date.UTC(2026, 8, day, 10, 0, 0)) : null,
        reviewedBy: day <= 2 ? regionalDirector.id : null,
        submissionDeadline: new Date(Date.UTC(2026, 8, day + 1, 10, 0, 0)),
      },
    });

    // Create revenue
    const roomRevenue = 25000 + Math.random() * 5000;
    const minibarRevenue = 800 + Math.random() * 200;
    const foodRevenue = 3000 + Math.random() * 1000;
    const otherRevenue = 500 + Math.random() * 300;
    const totalRevenue = roomRevenue + minibarRevenue + foodRevenue + otherRevenue;

    await prisma.revenue.create({
      data: {
        dailyOperationId: dailyOp.id,
        roomRevenue,
        minibarRevenue,
        foodRevenue,
        otherRevenue,
        totalRevenue,
      },
    });

    // Create variable cost
    const roomSuppliesCost = 800 + Math.random() * 200;
    const frontDeskItemsCost = 200 + Math.random() * 100;
    const merchandiseCost = 150 + Math.random() * 50;
    const laundryCost = 300 + Math.random() * 100;
    const restaurantCost = 1000 + Math.random() * 300;
    const otherVariableCost = 200 + Math.random() * 100;
    const totalVariableCost = roomSuppliesCost + frontDeskItemsCost + merchandiseCost + laundryCost + restaurantCost + otherVariableCost;

    await prisma.variableCost.create({
      data: {
        dailyOperationId: dailyOp.id,
        roomSuppliesCost,
        frontDeskItemsCost,
        merchandiseCost,
        laundryCost,
        restaurantCost,
        otherVariableCost,
        totalVariableCost,
      },
    });

    // Create labor cost
    const frontDeskWages = 500;
    const housekeepingWages = 800;
    const restaurantWages = 600;
    const managementWages = 400;
    const totalLaborCost = frontDeskWages + housekeepingWages + restaurantWages + managementWages;

    await prisma.laborCost.create({
      data: {
        dailyOperationId: dailyOp.id,
        frontDeskWages,
        housekeepingWages,
        restaurantWages,
        managementWages,
        totalLaborCost,
      },
    });

    // Create commission cost
    const reviewCommission = 200 + Math.random() * 100;
    const qrCommission = 150 + Math.random() * 50;
    const memberCardCommission = 100 + Math.random() * 50;
    const housekeepingCommission = 300 + Math.random() * 100;
    const totalCommissionCost = reviewCommission + qrCommission + memberCardCommission + housekeepingCommission;

    await prisma.commissionCost.create({
      data: {
        dailyOperationId: dailyOp.id,
        reviewCommission,
        qrCommission,
        memberCardCommission,
        housekeepingCommission,
        totalCommissionCost,
      },
    });

    // Create fixed cost
    const rent = 500;
    const platformPromotionFee = 300;
    const otherFixedCost = 200;
    const totalFixedCost = rent + platformPromotionFee + otherFixedCost;

    await prisma.fixedCost.create({
      data: {
        dailyOperationId: dailyOp.id,
        rent,
        platformPromotionFee,
        otherFixedCost,
        totalFixedCost,
      },
    });

    // Create energy
    const electricityConsumption = 800 + Math.random() * 200;
    const electricityUnitPrice = 0.8;
    const electricityCost = electricityConsumption * electricityUnitPrice;
    const waterConsumption = 100 + Math.random() * 30;
    const waterUnitPrice = 3.5;
    const waterCost = waterConsumption * waterUnitPrice;
    const gasConsumption = 50 + Math.random() * 20;
    const gasUnitPrice = 2.8;
    const gasCost = gasConsumption * gasUnitPrice;
    const totalUtilityCost = electricityCost + waterCost + gasCost;

    await prisma.energy.create({
      data: {
        dailyOperationId: dailyOp.id,
        electricityConsumption,
        electricityUnitPrice,
        electricityCost,
        waterConsumption,
        waterUnitPrice,
        waterCost,
        gasConsumption,
        gasUnitPrice,
        gasCost,
        totalUtilityCost,
      },
    });

    // Create room status (sold rooms)
    const soldRooms = Math.floor(80 + Math.random() * 30); // 80-110 rooms sold
    await prisma.roomStatus.create({
      data: {
        dailyOperationId: dailyOp.id,
        soldRooms,
      },
    });

    // Calculate totals
    const totalCost = totalVariableCost + totalLaborCost + totalCommissionCost + totalFixedCost + totalUtilityCost;
    const gop = totalRevenue - totalCost;
    const gopRate = totalRevenue > 0 ? gop / totalRevenue : 0;
    const occupancyRate = soldRooms / hotel.physicalRoomCount;
    const avgRoomRate = totalRevenue / soldRooms;
    const revpar = avgRoomRate * occupancyRate;

    // Create calculation result
    await prisma.calculationResult.create({
      data: {
        dailyOperationId: dailyOp.id,
        totalRevenue,
        totalVariableCost,
        totalLaborCost,
        totalCommissionCost,
        totalFixedCost,
        totalCost,
        gop,
        gopRate,
        occupancyRate,
        avgRoomRate,
        revpar,
        isRevenueAnomaly: totalRevenue < 30000,
        isCostAnomaly: totalCost > 28000,
        calculationVersion: '1.0.0',
        calculatedAt: new Date(2026, 8, day, 23, 59, 59),
      },
    });

    // Create anomalies for some days
    if (day === 3) {
      await prisma.anomaly.create({
        data: {
          dailyOperationId: dailyOp.id,
          calculationResultId: (await prisma.calculationResult.findFirst({ where: { dailyOperationId: dailyOp.id } }))!.id,
          type: 'REVENUE',
          severity: 'WARNING',
          expectedValue: 35000,
          actualValue: totalRevenue,
          deviation: totalRevenue - 35000,
          deviationRate: (totalRevenue - 35000) / 35000,
          description: 'Revenue lower than expected',
          status: 'PENDING',
        },
      });
    }

    console.log(`Created daily operation for September ${day} with status ${status}`);
  }

  // Create more hotels for regional review list
  const hotel2 = await prisma.hotel.create({
    data: {
      name: '青岛欢致酒店',
      code: 'QD-HZ-001',
      physicalRoomCount: 85,
      regionId: region.id,
      status: 'ACTIVE',
    },
  });

  const hotel3 = await prisma.hotel.create({
    data: {
      name: '烟台菲伦酒店',
      code: 'YT-FL-001',
      physicalRoomCount: 98,
      regionId: region.id,
      status: 'ACTIVE',
    },
  });

  console.log('Created additional hotels');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
