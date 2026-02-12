/**
 * DataDisplay Components Showcase
 * Arcane Design System - Tier 2 Components
 *
 * This file demonstrates usage of all DataDisplay components
 */

import React from 'react';
import { Table, DataGrid, List } from './index';

// Sample data types
interface Player {
  id: number;
  name: string;
  position: string;
  rating: number;
  age: number;
  club: string;
}

// Sample data
const samplePlayers: Player[] = [
  { id: 1, name: 'Lionel Messi', position: 'RW', rating: 93, age: 36, club: 'Inter Miami' },
  { id: 2, name: 'Cristiano Ronaldo', position: 'ST', rating: 91, age: 38, club: 'Al Nassr' },
  { id: 3, name: 'Kylian Mbappé', position: 'ST', rating: 92, age: 25, club: 'Real Madrid' },
  { id: 4, name: 'Erling Haaland', position: 'ST', rating: 91, age: 23, club: 'Man City' },
  { id: 5, name: 'Kevin De Bruyne', position: 'CAM', rating: 91, age: 32, club: 'Man City' },
];

export function DataDisplayShowcase() {
  return (
    <div className="space-y-12 p-8 bg-arcane-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-arcane-yellow mb-2">
          DataDisplay Components
        </h1>
        <p className="text-arcane-gray-400 mb-8">
          Showcase of all Tier 2 data display components
        </p>

        {/* Table Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Table</h2>
          <p className="text-arcane-gray-400 mb-6">
            Advanced data table with sorting, filtering, pagination, and row selection
          </p>

          <Table
            data={samplePlayers}
            columns={[
              {
                id: 'name',
                header: 'Player Name',
                sortable: true,
                filterable: true,
              },
              {
                id: 'position',
                header: 'Position',
                filterable: true,
                align: 'center',
              },
              {
                id: 'rating',
                header: 'Rating',
                sortable: true,
                align: 'center',
                accessor: (player) => (
                  <span className="text-arcane-yellow font-semibold">
                    {player.rating}
                  </span>
                ),
              },
              {
                id: 'age',
                header: 'Age',
                sortable: true,
                align: 'center',
              },
              {
                id: 'club',
                header: 'Club',
                filterable: true,
              },
            ]}
            selectable
            pagination
            defaultPageSize={10}
            stickyHeader
            onRowClick={(player) => console.log('Clicked:', player)}
            onSelectionChange={(selected) => console.log('Selected:', selected)}
          />
        </section>

        {/* DataGrid Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">DataGrid</h2>
          <p className="text-arcane-gray-400 mb-6">
            Responsive grid layout for displaying data items
          </p>

          <DataGrid
            data={samplePlayers}
            columns={3}
            gap="lg"
            renderItem={(player) => (
              <div className="bg-arcane-charcoal rounded-xl p-6 border border-arcane-slate hover:border-arcane-yellow transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{player.name}</h3>
                  <span className="text-2xl font-bold text-arcane-yellow">
                    {player.rating}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-arcane-gray-400">Position:</span>
                    <span className="text-white font-medium">{player.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-arcane-gray-400">Age:</span>
                    <span className="text-white font-medium">{player.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-arcane-gray-400">Club:</span>
                    <span className="text-white font-medium">{player.club}</span>
                  </div>
                </div>
              </div>
            )}
          />
        </section>

        {/* List Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">List</h2>
          <p className="text-arcane-gray-400 mb-6">
            Vertical list layout with dividers and custom spacing
          </p>

          <List
            data={samplePlayers}
            dividers
            spacing="md"
            renderItem={(player) => (
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-arcane-yellow flex items-center justify-center text-arcane-black font-bold text-xl">
                    {player.rating}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{player.name}</h4>
                    <p className="text-arcane-gray-400 text-sm">
                      {player.position} • {player.club}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{player.age} years</p>
                  <p className="text-arcane-gray-400 text-sm">Age</p>
                </div>
              </div>
            )}
          />
        </section>

        {/* Loading States */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Loading States</h2>
          <p className="text-arcane-gray-400 mb-6">
            All components include built-in loading states with skeletons
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Table Loading</h3>
              <Table
                data={[]}
                columns={[
                  { id: 'name', header: 'Name' },
                  { id: 'position', header: 'Position' },
                  { id: 'rating', header: 'Rating' },
                ]}
                loading
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">DataGrid Loading</h3>
              <DataGrid
                data={[]}
                columns={3}
                loading
                renderItem={() => <div />}
              />
            </div>
          </div>
        </section>

        {/* Empty States */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Empty States</h2>
          <p className="text-arcane-gray-400 mb-6">
            All components include empty state messages
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Table Empty</h3>
              <Table
                data={[]}
                columns={[
                  { id: 'name', header: 'Name' },
                  { id: 'position', header: 'Position' },
                ]}
                emptyMessage="No players found"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
