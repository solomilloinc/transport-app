"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, format, isEqual, parseISO } from "date-fns";
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

  // Generate dates (today + 14 days)
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateArray: Date[] = [];
    for (let i = 0; i < 14; i++) {
      dateArray.push(addDays(today, i));
    }
    setDates(dateArray);
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = 200; // Adjust as needed

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

  return (
    <div className={cn("relative", className)}>
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
          {dates.map((date) => {
            const dateString = format(date, "yyyy-MM-dd");
            const isSelected = isEqual(date, parsedSelectedDate);
            const isToday = isEqual(
              date,
              new Date(new Date().setHours(0, 0, 0, 0))
            );

            return (
              <button
                key={dateString}
                onClick={() => onDateSelect(dateString)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[80px] h-20 mx-1 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                )}
              >
                <span className="text-xs font-medium">
                  {format(date, "EEE", { locale: es })}
                </span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    isSelected ? "text-white" : "text-blue-900"
                  )}
                >
                  {format(date, "d")}
                </span>
                <span className="text-xs">
                  {isToday ? "Today" : format(date, "MMM", { locale: es })}
                </span>
              </button>
            );
          })}
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
  );
}
