using System;

namespace LogisticsFleetTracker.Api.Models;

public class Driver
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string VehicleRegistration { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
}