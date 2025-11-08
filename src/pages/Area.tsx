import React from 'react';
import { useParams, Link } from 'react-router-dom';
import areasData from '../data/mock_areas.json';
import rwpsData from '../data/mock_rwps.json';
import { Area, RWP } from '../lib/types';
import MapCard from '../components/MapCard';

/**
 * Shows details of a selected area and lists work permits (RWPs) associated with it.
 */
const AreaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const seed = areasData as unknown as { ctmt: Area[]; rhr: Area[] };
  const areaList = [...(seed.ctmt || []), ...(seed.rhr || [])] as Area[];
  const area = areaList.find((a) => a.id === id);
  const rwps = (rwpsData as any as RWP[]).filter((rwp) => rwp.areaId === id);

  if (!area) {
    return <div className="p-4">Area not found</div>;
  }

  return (
    <div className="p-4">
      <MapCard area={area} />
      <h2 className="text-lg font-bold mt-4">Work Permits</h2>
      <ul className="mt-2">
        {rwps.map((rwp) => (
          <li key={rwp.id} className="mb-2">
            <Link
              to={`/entry/${rwp.id}`}
              className="text-blue-600 underline"
            >
              {rwp.task} ({rwp.workOrder})
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Link to="/" className="text-blue-600 underline">
          &larr; Back
        </Link>
      </div>
    </div>
  );
};

export default AreaPage;