using LogisticsFleetTracker.Api.Models;
using System;


namespace LogisticsFleetTracker.Api.Models;

public class StatusLog
{
    public int Id { get; set; }

    public int ShipmentId { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Shipment Shipment { get; set; } = null!;
}