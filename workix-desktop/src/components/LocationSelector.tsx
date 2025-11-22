'use client';

import { useEffect } from 'react';
import { useSites, useBuildings, useFloors, useSpaces } from '@/hooks/useApi';

interface LocationSelectorProps {
  siteId?: string;
  buildingId?: number;
  floorId?: number;
  spaceId?: number;
  onSiteChange?: (siteId: string) => void;
  onBuildingChange?: (buildingId: number) => void;
  onFloorChange?: (floorId: number) => void;
  onSpaceChange?: (spaceId: number) => void;
  required?: boolean;
  disabled?: boolean;
  showLabels?: boolean;
  className?: string;
}

/**
 * LocationSelector - Cascading location dropdowns
 * Provides Site → Building → Floor → Space selection hierarchy
 * 
 * Usage:
 * ```tsx
 * <LocationSelector
 *   siteId={formData.site_id}
 *   buildingId={formData.building_id}
 *   floorId={formData.floor_id}
 *   spaceId={formData.space_id}
 *   onSiteChange={(id) => setFormData(prev => ({ ...prev, site_id: id }))}
 *   onBuildingChange={(id) => setFormData(prev => ({ ...prev, building_id: id }))}
 *   onFloorChange={(id) => setFormData(prev => ({ ...prev, floor_id: id }))}
 *   onSpaceChange={(id) => setFormData(prev => ({ ...prev, space_id: id }))}
 * />
 * ```
 */
export default function LocationSelector({
  siteId,
  buildingId,
  floorId,
  spaceId,
  onSiteChange,
  onBuildingChange,
  onFloorChange,
  onSpaceChange,
  required = false,
  disabled = false,
  showLabels = true,
  className = '',
}: LocationSelectorProps) {
  // Fetch data
  const { data: sites = [], isLoading: sitesLoading } = useSites();
  const { data: buildings = [], isLoading: buildingsLoading } = useBuildings(
    siteId ? { site_id: siteId } : undefined
  );
  const { data: floors = [], isLoading: floorsLoading } = useFloors(
    buildingId ? { building_id: buildingId } : undefined
  );
  const { data: spaces = [], isLoading: spacesLoading } = useSpaces(
    floorId ? { floor_id: floorId } : undefined
  );

  // Reset cascading selections when parent changes
  useEffect(() => {
    if (!siteId && buildingId && onBuildingChange) {
      onBuildingChange(0);
    }
  }, [siteId, buildingId, onBuildingChange]);

  useEffect(() => {
    if (!buildingId && floorId && onFloorChange) {
      onFloorChange(0);
    }
  }, [buildingId, floorId, onFloorChange]);

  useEffect(() => {
    if (!floorId && spaceId && onSpaceChange) {
      onSpaceChange(0);
    }
  }, [floorId, spaceId, onSpaceChange]);

  const baseSelectClass = `w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    disabled:bg-gray-100 disabled:cursor-not-allowed`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Site Selector */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          value={siteId || ''}
          onChange={(e) => onSiteChange && onSiteChange(e.target.value)}
          disabled={disabled || sitesLoading}
          required={required}
          className={baseSelectClass}
        >
          <option value="">
            {sitesLoading ? 'Loading sites...' : 'Select a site'}
          </option>
          {sites.map((site: any) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {/* Building Selector */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Building {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          value={buildingId || ''}
          onChange={(e) => onBuildingChange && onBuildingChange(Number(e.target.value))}
          disabled={disabled || !siteId || buildingsLoading}
          required={required}
          className={baseSelectClass}
        >
          <option value="">
            {!siteId
              ? 'Select site first'
              : buildingsLoading
              ? 'Loading buildings...'
              : 'Select a building'}
          </option>
          {buildings.map((building: any) => (
            <option key={building.id} value={building.id}>
              {building.name} {building.building_code && `(${building.building_code})`}
            </option>
          ))}
        </select>
        {buildings.length === 0 && siteId && !buildingsLoading && (
          <p className="mt-1 text-sm text-gray-500">No buildings found for this site</p>
        )}
      </div>

      {/* Floor Selector */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Floor
          </label>
        )}
        <select
          value={floorId || ''}
          onChange={(e) => onFloorChange && onFloorChange(Number(e.target.value))}
          disabled={disabled || !buildingId || floorsLoading}
          className={baseSelectClass}
        >
          <option value="">
            {!buildingId
              ? 'Select building first'
              : floorsLoading
              ? 'Loading floors...'
              : 'Select a floor (optional)'}
          </option>
          {floors.map((floor: any) => (
            <option key={floor.id} value={floor.id}>
              Floor {floor.floor_number} - {floor.name}
            </option>
          ))}
        </select>
        {floors.length === 0 && buildingId && !floorsLoading && (
          <p className="mt-1 text-sm text-gray-500">No floors found for this building</p>
        )}
      </div>

      {/* Space Selector */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Space
          </label>
        )}
        <select
          value={spaceId || ''}
          onChange={(e) => onSpaceChange && onSpaceChange(Number(e.target.value))}
          disabled={disabled || !floorId || spacesLoading}
          className={baseSelectClass}
        >
          <option value="">
            {!floorId
              ? 'Select floor first'
              : spacesLoading
              ? 'Loading spaces...'
              : 'Select a space (optional)'}
          </option>
          {spaces.map((space: any) => (
            <option key={space.id} value={space.id}>
              {space.name} {space.space_type && `(${space.space_type})`}
            </option>
          ))}
        </select>
        {spaces.length === 0 && floorId && !spacesLoading && (
          <p className="mt-1 text-sm text-gray-500">No spaces found for this floor</p>
        )}
      </div>
    </div>
  );
}
