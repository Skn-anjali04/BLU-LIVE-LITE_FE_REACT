import { useState, useCallback, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

 function Combobox({
  name,
  value,
  onValueChange,
  options = [],
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  noDataMessage = "No options found.",
  className = "",
  triggerClassName = "",
  contentClassName = "",
  inputClassName = "",
  itemClassName = "",
  disabled = false,
  multiSelect = false,
  isLoading = false,
  onOpenChange: onOpenChangeProp,
  onSearch,
  renderOption,
  error,
  errorClassName = "text-destructive text-sm",
  icon = <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />,
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (currentValue) => {
      if (multiSelect) {
        const newValue = Array.isArray(value) ? [...value] : [];
        if (newValue.includes(currentValue)) {
          onValueChange(newValue.filter((v) => v !== currentValue));
        } else {
          onValueChange([...newValue, currentValue]);
        }
      } else {
        onValueChange(currentValue === value ? "" : currentValue);
        setOpen(false);
      }
    },
    [value, onValueChange, multiSelect]
  );

  const handleOpenChange = useCallback(
    (isOpen) => {
      setOpen(isOpen);
      if (onOpenChangeProp) {
        onOpenChangeProp(isOpen);
      }
    },
    [onOpenChangeProp]
  );

  const displayValue = useMemo(() => {
    if (multiSelect && Array.isArray(value)) {
      return value
        .map((val) => options.find((opt) => opt.value === val)?.label)
        .filter(Boolean)
        .join(", ") || placeholder;
    }
    return options.find((opt) => opt.value === value)?.label || placeholder;
  }, [value, options, placeholder, multiSelect]);

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={placeholder}
            disabled={disabled || isLoading}
            className={cn("w-full justify-between bg-transparent", disabled && "opacity-50 cursor-not-allowed", triggerClassName)}
          >
            <span className="truncate">{isLoading ? "Loading..." : displayValue}</span>
            {icon}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-full p-0  bg-[#3A3A3A] border-[#444444] text-white", contentClassName)}>
          <Command className="bg-[#3A3A3A] bg-transparent">
            <CommandInput
              placeholder={searchPlaceholder}
              className={cn("h-9 text-white bg-transparent", inputClassName)}
              onValueChange={onSearch}
            />
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Loading...</CommandEmpty>
              ) : (
                <CommandEmpty>{noDataMessage}</CommandEmpty>
              )}
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    className={cn("text-white hover:bg-[#444444] hover:text-white",itemClassName)}
                    disabled={option.disabled}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <>
                        {option.label}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            multiSelect
                              ? value.includes(option.value) ? "opacity-100" : "opacity-0"
                              : value === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <div className={cn(errorClassName)}>{error}</div>}
    </div>
  );
}
export default Combobox;
