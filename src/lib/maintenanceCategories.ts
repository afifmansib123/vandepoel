import { Wrench, Zap, Droplets, Thermometer, Shield, Bug, DoorOpen, Wind, Tv, Waves } from 'lucide-react';

export interface MaintenanceCategory {
  name: string;
  icon: React.ElementType;
  description: string;
}

export const maintenanceCategories: MaintenanceCategory[] = [
  {
    name: 'Plumbing',
    icon: Droplets,
    description: 'Leaking faucet, clogged drain, toilet issues, no hot water.'
  },
  {
    name: 'Electrical',
    icon: Zap,
    description: 'Outlet not working, light fixture issue, circuit breaker tripping.'
  },
  {
    name: 'HVAC',
    icon: Thermometer,
    description: 'Air conditioning not cooling, heater not working, thermostat issues.'
  },
  {
    name: 'Appliances',
    icon: Tv,
    description: 'Refrigerator, oven, dishwasher, or washer/dryer malfunction.'
  },
  {
    name: 'Doors & Locks',
    icon: DoorOpen,
    description: 'Broken lock, door not closing properly, key issues.'
  },
  {
    name: 'Windows & Glass',
    icon: Wind,
    description: 'Broken window pane, window won\'t open/close, broken seal.'
  },
  {
    name: 'Pest Control',
    icon: Bug,
    description: 'Insects (ants, roaches), rodents, or other pest problems.'
  },
  {
    name: 'Safety',
    icon: Shield,
    description: 'Smoke detector beeping, security system issue, broken railing.'
  },
  {
    name: 'General Repair',
    icon: Wrench,
    description: 'Damaged flooring/tiles, wall damage, cabinet issues, other repairs.'
  }
];