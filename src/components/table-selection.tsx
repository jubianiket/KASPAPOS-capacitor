"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tables = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);

interface TableSelectionProps {
  selectedTable: string;
  onSelectTable: (table: string) => void;
}

export default function TableSelection({ selectedTable, onSelectTable }: TableSelectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Select a Table</h3>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {tables.map((table) => (
          <Card
            key={table}
            onClick={() => onSelectTable(table)}
            className={cn(
              "cursor-pointer transition-all duration-200 aspect-square flex items-center justify-center",
              selectedTable === table
                ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary ring-offset-2"
                : "hover:bg-muted/50"
            )}
          >
            <CardContent className="p-2">
              <span className="font-bold text-lg">{table}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
