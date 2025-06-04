declare module 'recharts' {
  import { ComponentType, ReactNode } from 'react';

  export interface CartesianGridProps {
    strokeDasharray?: string;
    stroke?: string;
    [key: string]: any;
  }

  export interface XAxisProps {
    dataKey?: string;
    stroke?: string;
    [key: string]: any;
  }

  export interface YAxisProps {
    stroke?: string;
    [key: string]: any;
  }

  export interface TooltipProps {
    contentStyle?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
    formatter?: (value: any, name: string) => [string, string];
    [key: string]: any;
  }

  export interface LineProps {
    type?: string;
    dataKey?: string;
    stroke?: string;
    strokeWidth?: number;
    dot?: any;
    [key: string]: any;
  }

  export interface PieProps {
    data?: any[];
    cx?: string;
    cy?: string;
    labelLine?: boolean;
    outerRadius?: number;
    fill?: string;
    dataKey?: string;
    [key: string]: any;
  }

  export const CartesianGrid: ComponentType<CartesianGridProps>;
  export const XAxis: ComponentType<XAxisProps>;
  export const YAxis: ComponentType<YAxisProps>;
  export const Tooltip: ComponentType<TooltipProps>;
  export const Line: ComponentType<LineProps>;
  export const Pie: ComponentType<PieProps>;
  export const LineChart: ComponentType<any>;
  export const PieChart: ComponentType<any>;
  export const AreaChart: ComponentType<any>;
  export const Area: ComponentType<any>;
  export const ResponsiveContainer: ComponentType<any>;
  export const Cell: ComponentType<any>;
  export const BarChart: ComponentType<any>;
  export const Bar: ComponentType<any>;
  export const Legend: ComponentType<any>;
} 