import { useState } from "react";
import { Search, Bell, User, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "./LanguageSwitcher";
import logoFull from "@/assets/logo-full.png";

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 bg-card shadow-lg border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center space-x-reverse space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="hover:bg-accent lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="relative w-96 max-lg:hidden">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن الطلاب، المحاضرين، المقررات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-muted/50 border-0 focus:bg-background focus:shadow-md transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center space-x-reverse space-x-4">
        
        <Button variant="ghost" size="icon" className="relative hover:bg-accent">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center p-0 bg-destructive">
            3
          </Badge>
        </Button>
        
        <Button variant="ghost" size="icon" className="hover:bg-accent">
          <Settings className="w-5 h-5" />
        </Button>

        <div className="flex items-center space-x-reverse space-x-3 pr-4 border-r border-border">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="text-sm max-lg:hidden">
            <p className="font-medium text-foreground">Admin User</p>
            <p className="text-muted-foreground">مسؤول النظام</p>
          </div>
        </div>
      </div>
    </header>
  );
}