using LogisticsFleetTracker.Api.Controllers;
using LogisticsFleetTracker.Api.Data;
using LogisticsFleetTracker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LogisticsFleetTracker.Tests;

// Unit Tests written for CLDV6212 ICE Task
// Verifying RESTful API endpoints and Entity Framework operations
public class ShipmentTests
{
    private AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task DbSeeder_SeedsInitialDriversAndShipments()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Test_SeedDatabase");

        // Act
        await DbSeeder.SeedAsync(db);

        // Assert
        var drivers = await db.Drivers.ToListAsync();
        var shipments = await db.Shipments.ToListAsync();

        Assert.Equal(3, drivers.Count);
        Assert.Equal(5, shipments.Count);
    }

    [Fact]
    public async Task CreateShipment_ReturnsCreatedShipmentWithTrackingNumber()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Test_CreateShipment");
        await DbSeeder.SeedAsync(db);
        var controller = new ShipmentsController(db);

        var request = new CreateShipmentRequest
        {
            SenderName = "Acme Corp",
            RecipientName = "John Doe",
            DestinationAddress = "10 Smith Street, Durban",
            PackageWeightKg = 3.5m,
            DriverId = 1
        };

        // Act
        var result = await controller.CreateShipment(request);

        // Assert
        var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var shipment = Assert.IsType<Shipment>(createdAtActionResult.Value);

        Assert.StartsWith("LFT-", shipment.TrackingNumber);
        Assert.Equal("Pending", shipment.CurrentStatus);
        Assert.Equal("John Doe", shipment.RecipientName);
    }

    [Fact]
    public async Task TrackShipment_ReturnsShipment_WhenTrackingNumberExists()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Test_TrackShipment");
        await DbSeeder.SeedAsync(db);
        var controller = new ShipmentsController(db);

        // Act
        var result = await controller.TrackShipment("LFT-DEMO001");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var shipment = Assert.IsType<Shipment>(okResult.Value);

        Assert.Equal("LFT-DEMO001", shipment.TrackingNumber);
        Assert.Equal("Sarah Naidoo", shipment.RecipientName);
    }

    [Fact]
    public async Task UpdateStatus_UpdatesCurrentStatusAndAppendsLog()
    {
        // Arrange
        using var db = CreateInMemoryDbContext("Test_UpdateStatus");
        await DbSeeder.SeedAsync(db);
        var controller = new ShipmentsController(db);

        var updateRequest = new UpdateShipmentStatusRequest
        {
            Status = "Delivered",
            Notes = "Signed by recipient at reception desk."
        };

        // Act
        var result = await controller.UpdateStatus(1, updateRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updatedShipment = Assert.IsType<Shipment>(okResult.Value);

        Assert.Equal("Delivered", updatedShipment.CurrentStatus);

        // Check status log was appended
        var logs = await db.StatusLogs.Where(l => l.ShipmentId == 1).ToListAsync();
        Assert.Contains(logs, l => l.Status == "Delivered" && l.Notes == "Signed by recipient at reception desk.");
    }
}
