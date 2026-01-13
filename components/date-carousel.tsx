"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, subDays, format, isEqual, parseISO, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DateCarouselProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  className?: string;
}

export function DateCarousel({
  selectedDate,
  onDateSelect,
  className,
}: DateCarouselProps) {
  const [dates, setDates] = useState<Date[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const parsedSelectedDate = parseISO(selectedDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate dates (today + 14 days)
  useEffect(() => {
    const dateArray: Date[] = [];
    for (let i = 0; i < 14; i++) {
      dateArray.push(addDays(today, i));
    }
    setDates(dateArray);
  }, []);

  // Get 3 dates for mobile view: previous, selected, next
  const getMobileViewDates = () => {
    const prevDate = subDays(parsedSelectedDate, 1);
    const nextDate = addDays(parsedSelectedDate, 1);
    
    // Check if prev date is before today
    const canGoPrev = !isBefore(prevDate, today);
    
    // Check if next date is within 14 days from today
    const maxDate = addDays(today, 13);
    const canGoNext = !isBefore(maxDate, nextDate);
    
    return { prevDate, nextDate, canGoPrev, canGoNext };
  };

  const { prevDate, nextDate, canGoPrev, canGoNext } = getMobileViewDates();

  const handleMobileNav = (direction: "left" | "right") => {
    if (direction === "left" && canGoPrev) {
      onDateSelect(format(prevDate, "yyyy-MM-dd"));
    } else if (direction === "right" && canGoNext) {
      onDateSelect(format(nextDate, "yyyy-MM-dd"));
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = 200;

    if (direction === "left") {
      setScrollPosition(Math.max(0, scrollPosition - scrollAmount));
      container.scrollTo({
        left: Math.max(0, scrollPosition - scrollAmount),
        behavior: "smooth",
      });
    } else {
      const newPosition = scrollPosition + scrollAmount;
      setScrollPosition(newPosition);
      container.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });
    }
  };

  // Auto-scroll to selected date on desktop
  useEffect(() => {
    if (!scrollContainerRef.current || dates.length === 0) return;

    const daysDiff = Math.floor((parsedSelectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 0 && daysDiff < 14) {
      const scrollTo = daysDiff * 82;
      
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          left: scrollTo,
          behavior: "smooth",
        });
        setScrollPosition(scrollTo);
      }, 100);
    }
  }, [dates, selectedDate]);

  const renderDateButton = (date: Date, size: "sm" | "lg" = "lg") => {
    const dateString = format(date, "yyyy-MM-dd");
    const isSelected = isEqual(date, parsedSelectedDate);
    const isToday = isEqual(date, today);

    return (
      <button
        key={dateString}
        onClick={() => onDateSelect(dateString)}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          size === "sm" ? "min-w-[60px] h-16 mx-0.5" : "min-w-[80px] h-20 mx-1",
          isSelected
            ? "bg-blue-600 text-white border-blue-600 scale-110 shadow-lg"
            : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:scale-105 hover:shadow-md"
        )}
      >
        <span className={cn("font-medium", size === "sm" ? "text-[10px]" : "text-xs")}>
          {format(date, "EEE", { locale: es })}
        </span>
        <span
          className={cn(
            "font-bold",
            size === "sm" ? "text-base" : "text-lg",
            isSelected ? "text-white" : "text-blue-900"
          )}
        >
          {format(date, "d")}
        </span>
        <span className={cn(size === "sm" ? "text-[10px]" : "text-xs")}>
          {isToday ? "Hoy" : format(date, "MMM", { locale: es })}
        </span>
      </button>
    );
  };

  return (
    <div className={cn("relative", className)}>
      {/* Mobile View - 3 dates with selected in middle */}
      <div className="sm:hidden">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full bg-white shadow-md border-gray-200 flex-shrink-0"
            onClick={() => handleMobileNav("left")}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Día anterior</span>
          </Button>

          <div className="flex items-center justify-center gap-1 px-2">
            {canGoPrev && renderDateButton(prevDate, "sm")}
            {renderDateButton(parsedSelectedDate, "lg")}
            {canGoNext && renderDateButton(nextDate, "sm")}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full bg-white shadow-md border-gray-200 flex-shrink-0"
            onClick={() => handleMobileNav("right")}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Día siguiente</span>
          </Button>
        </div>
      </div>

      {/* Desktop View - Full carousel */}
      <div className="hidden sm:block">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 z-10 rounded-full bg-white shadow-md border-gray-200"
            onClick={() => handleScroll("left")}
            disabled={scrollPosition <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Scroll left</span>
          </Button>

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide py-2 px-8 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {dates.map((date) => renderDateButton(date))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 z-10 rounded-full bg-white shadow-md border-gray-200"
            onClick={() => handleScroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Scroll right</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
