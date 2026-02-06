"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const TableContext = React.createContext({ striped: false });

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  striped?: boolean;
}

export function Table({ className, striped, ...props }: TableProps) {
  return (
    <TableContext.Provider value={{ striped: !!striped }}>
      <table
        className={cn(
          "w-full caption-bottom text-sm text-left border-separate border-spacing-0",
          className,
        )}
        {...props}
      />
    </TableContext.Provider>
  );
}

export function TableHeader(
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) {
  return (
    <thead
      className={cn("bg-arcane-darkBorder/40 text-xs uppercase text-arcane-grey")}
      {...props}
    />
  );
}

export function TableBody(
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) {
  return <tbody {...props} />;
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  const { striped } = React.useContext(TableContext);
  return (
    <tr
      className={cn(
        "border-b border-arcane-darkBorder/50",
        striped && "odd:bg-arcane-dark/40",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold text-arcane-grey tracking-wide",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 align-middle", className)} {...props} />
  );
}
