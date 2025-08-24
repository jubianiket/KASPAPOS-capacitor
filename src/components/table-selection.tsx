
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TableSelectionProps {
  selectedTable: number | null;
  onSelectTable: (table: number) => void;
  occupiedTables: (number | null)[];
  tableCount: number;
}

export default function TableSelection({ selectedTable, onSelectTable, occupiedTables, tableCount }: TableSelectionProps) {
  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Select a Table</h3>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {tables.map((table) => {
          const isSelected = selectedTable === table;
          const isOccupied = occupiedTables.includes(table) && !isSelected;
          
          return (
            <Card
              key={table}
              onClick={() => onSelectTable(table)}
              className={cn(
                "cursor-pointer transition-all duration-200 aspect-square flex items-center justify-center relative",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary ring-offset-2"
                  : isOccupied
                  ? "bg-amber-500/20 border-amber-500 text-amber-700"
                  : "hover:bg-muted/50"
              )}
            >
              <CardContent className="p-2">
                <span className="font-bold text-lg">T{table}</span>
              </CardContent>
              {isOccupied && (
                 <span className="absolute -top-2 -right-2 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                </span>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  );
}
