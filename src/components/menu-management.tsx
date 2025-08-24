
"use client";

import { useState, useEffect, useMemo } from "react";
import { MenuItem, GroupedMenuItem } from "@/types";
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import MenuItemFormDialog from "./menu-item-form-dialog";
import { Separator } from "./ui/separator";

// This component is now deprecated and replaced by menu-management-grid.tsx and the menu page.
// It is kept in the project to avoid breaking imports, but it is no longer used.
export default function MenuManagement() {
  return <div>This component is deprecated.</div>
}
