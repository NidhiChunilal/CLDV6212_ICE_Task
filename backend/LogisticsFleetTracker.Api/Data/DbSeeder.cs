using System;
using LogisticsFleetTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsFleetTracker.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Drivers.AnyAsync())
            return;

        var drivers = new[]
        {
            new Driver
            {
                FullName = "Thabo Mokoena",
                VehicleRegistration = "ND 12345",
                PhoneNumber = "071 000 0001",
                IsActive = true
            },
            new Driver
            {
                FullName = "Ayesha Khan",
                VehicleRegistration = "ND 67890",
                PhoneNumber = "072 000 0002",
                IsActive = true
            },
            new Driver
            {
                FullName = "Jason Naidoo",
                VehicleRegistration = "ND 24680",
                PhoneNumber = "073 000 0003",
                IsActive = true
            }
        };

        db.Drivers.AddRange(drivers);

        await db.SaveChangesAsync();

        var shipments = new[]
        {
            new Shipment
            {
                TrackingNumber = "LFT-DEMO001",
                SenderName = "Demo Courier",
                RecipientName = "Sarah Naidoo",
                DestinationAddress = "12 Florida Road, Durban",
                PackageWeightKg = 2.5m,
                CurrentStatus = "In Transit",
                DriverId = drivers[0].Id
            },

            new Shipment
            {
                TrackingNumber = "LFT-DEMO002",
                SenderName = "Demo Courier",
                RecipientName = "Michael Singh",
                DestinationAddress = "8 Umhlanga Ridge, Durban",
                PackageWeightKg = 1.2m,
                CurrentStatus = "Dispatched",
                DriverId = drivers[1].Id
            },

            new Shipment
            {
                TrackingNumber = "LFT-DEMO003",
                SenderName = "Demo Courier",
                RecipientName = "Priya Pillay",
                DestinationAddress = "45 Westville Road, Durban",
                PackageWeightKg = 4.1m,
                CurrentStatus = "Delivered",
                DriverId = drivers[2].Id
            },

            new Shipment
            {
                TrackingNumber = "LFT-DEMO004",
                SenderName = "Demo Courier",
                RecipientName = "Liam Smith",
                DestinationAddress = "2 Ballito Drive, Ballito",
                PackageWeightKg = 0.8m,
                CurrentStatus = "Delayed",
                DriverId = drivers[0].Id
            },

            new Shipment
            {
                TrackingNumber = "LFT-DEMO005",
                SenderName = "Demo Courier",
                RecipientName = "Nadia Govender",
                DestinationAddress = "90 La Lucia Mall Road, Durban",
                PackageWeightKg = 3.3m,
                CurrentStatus = "Pending",
                DriverId = null
            }
        };

        db.Shipments.AddRange(shipments);

        await db.SaveChangesAsync();

        foreach (var shipment in shipments)
        {
            db.StatusLogs.Add(new StatusLog
            {
                ShipmentId = shipment.Id,
                Status = "Order Created",
                Notes = "Shipment created in the fleet system.",
                Timestamp = shipment.CreatedAt
            });

            if (shipment.CurrentStatus != "Pending")
            {
                db.StatusLogs.Add(new StatusLog
                {
                    ShipmentId = shipment.Id,
                    Status = shipment.CurrentStatus,
                    Notes = "Demo status.",
                    Timestamp = shipment.CreatedAt.AddHours(1)
                });
            }
        }

        await db.SaveChangesAsync();
    }
}