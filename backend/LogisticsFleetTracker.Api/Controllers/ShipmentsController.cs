using System;

using LogisticsFleetTracker.Api.Data;
using LogisticsFleetTracker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LogisticsFleetTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShipmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ShipmentsController(AppDbContext db)
    {
        _db = db;
    }

 
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Shipment>>> GetShipments()
    {
        var shipments = await _db.Shipments
            .Include(s => s.Driver)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(shipments);
    }


  
    [HttpPost]
    public async Task<ActionResult<Shipment>> CreateShipment(
        CreateShipmentRequest request)
    {
        // Check that the driver exists if a driver was supplied
        if (request.DriverId.HasValue)
        {
            var driverExists = await _db.Drivers
                .AnyAsync(d => d.Id == request.DriverId.Value);

            if (!driverExists)
            {
                return BadRequest(new
                {
                    message = "The selected driver does not exist."
                });
            }
        }

        // Generate a unique tracking number
        string trackingNumber;

        do
        {
            trackingNumber =
                "LFT-" +
                Guid.NewGuid()
                    .ToString("N")
                    .Substring(0, 12)
                    .ToUpper();
        }
        while (await _db.Shipments
            .AnyAsync(s => s.TrackingNumber == trackingNumber));

        // Create the shipment
        var shipment = new Shipment
        {
            TrackingNumber = trackingNumber,
            SenderName = request.SenderName,
            RecipientName = request.RecipientName,
            DestinationAddress = request.DestinationAddress,
            PackageWeightKg = request.PackageWeightKg,
            CurrentStatus = "Pending",
            DriverId = request.DriverId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Shipments.Add(shipment);

        await _db.SaveChangesAsync();

        // Add the first status log
        var statusLog = new StatusLog
        {
            ShipmentId = shipment.Id,
            Status = "Pending",
            Notes = "Shipment created.",
            Timestamp = DateTime.UtcNow
        };

        _db.StatusLogs.Add(statusLog);

        await _db.SaveChangesAsync();

        // Return the newly created shipment
        return CreatedAtAction(
            nameof(GetShipment),
            new { id = shipment.Id },
            shipment);
    }


    [HttpGet("{id:int}")]
    public async Task<ActionResult<Shipment>> GetShipment(int id)
    {
        var shipment = await _db.Shipments
            .Include(s => s.Driver)
            .Include(s => s.StatusLogs)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shipment == null)
        {
            return NotFound(new
            {
                message = "Shipment not found."
            });
        }

        return Ok(shipment);
    }


    
    [HttpGet("track/{trackingNumber}")]
    public async Task<ActionResult<Shipment>> TrackShipment(
        string trackingNumber)
    {
        var shipment = await _db.Shipments
            .Include(s => s.Driver)
            .Include(s => s.StatusLogs)
            .FirstOrDefaultAsync(s =>
                s.TrackingNumber.ToUpper() ==
                trackingNumber.ToUpper());

        if (shipment == null)
        {
            return NotFound(new
            {
                message = "No shipment found with that tracking number."
            });
        }

        return Ok(shipment);
    }


    
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<Shipment>> UpdateStatus(
        int id,
        UpdateShipmentStatusRequest request)
    {
        var shipment = await _db.Shipments
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shipment == null)
        {
            return NotFound(new
            {
                message = "Shipment not found."
            });
        }

        // Allowed shipment statuses
        var allowedStatuses = new[]
        {
            "Pending",
            "Dispatched",
            "In Transit",
            "Out for Delivery",
            "Delivered",
            "Delayed"
        };

        if (!allowedStatuses.Contains(request.Status))
        {
            return BadRequest(new
            {
                message = "Invalid shipment status.",
                allowedStatuses
            });
        }

        // Update current shipment status
        shipment.CurrentStatus = request.Status;

        // Create a status history record
        var statusLog = new StatusLog
        {
            ShipmentId = shipment.Id,
            Status = request.Status,
            Notes = request.Notes,
            Timestamp = DateTime.UtcNow
        };

        _db.StatusLogs.Add(statusLog);

        await _db.SaveChangesAsync();

      
        var updatedShipment = await _db.Shipments
            .Include(s => s.Driver)
            .Include(s => s.StatusLogs)
            .FirstAsync(s => s.Id == id);

        return Ok(updatedShipment);
    }
}



public class CreateShipmentRequest
{
    public string SenderName { get; set; } = string.Empty;

    public string RecipientName { get; set; } = string.Empty;

    public string DestinationAddress { get; set; } = string.Empty;

    public decimal PackageWeightKg { get; set; }

    public int? DriverId { get; set; }
}



public class UpdateShipmentStatusRequest
{
    public string Status { get; set; } = string.Empty;

    public string? Notes { get; set; }
}