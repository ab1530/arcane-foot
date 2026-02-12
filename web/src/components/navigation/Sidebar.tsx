'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover } from '@/components/composite/Feedback/Popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  NavigationConfig,
  NavItem,
  getNavigationByRole,
} from '@/config/navigation.config';
import type { UserRole } from '@/lib/roles';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = getNavigationByRole(user.role);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = item.href ? isActive(item.href) : false;

    return (
      <div key={item.title} className="w-full">
        {hasChildren ? (
          // Parent with children
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              depth > 0 && 'ml-4'
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon && <item.icon className="h-4 w-4" />}
              {!collapsed && <span>{item.title}</span>}
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2">
                {item.badge && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {item.badge}
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
          </button>
        ) : (
          // Leaf node
          <Link href={item.href || '#'}>
            <div
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                active && 'bg-accent text-accent-foreground font-semibold',
                depth > 0 && 'ml-4'
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="h-5 px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Render children if expanded */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1">
            {item.children?.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            {!collapsed && (
              <span className="font-bold text-xl">Arcane</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b">
        <Popover
          trigger="click"
          placement="bottom"
          contentClassName="w-56"
          content={
            <div className="flex flex-col gap-2">
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link href="/notifications">
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
              </Link>
              <hr className="my-2" />
              <Button variant="ghost" className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          }
        >
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start p-0',
              collapsed && 'justify-center'
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </Button>
        </Popover>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {navigation.mainNav.map((item) => renderNavItem(item))}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {navigation.quickActions.length > 0 && !collapsed && (
        <div className="p-4 border-t">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Quick Actions
          </p>
          <div className="space-y-1">
            {navigation.quickActions.map((action) => {
              if (!action.href) return null;
              return (
                <Link key={action.title} href={action.href}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    {action.icon && <action.icon className="h-3 w-3 mr-2" />}
                    <span className="text-xs">{action.title}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-background border-r transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-background border-r z-50 flex flex-col lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

export default Sidebar;
