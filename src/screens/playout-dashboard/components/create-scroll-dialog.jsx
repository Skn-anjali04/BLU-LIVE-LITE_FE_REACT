"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, LoaderCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
import { postDelEditScrolleer } from "@/utils/helpers/api/apiConstant";
import { v4 as uuidv4 } from "uuid";

export function CreateScrollDialog({
  open,
  onOpenChange,
  setScrollItems,
  initialItems,
  refetchScroll,
}) {
  const [items, setItems] = useState();
  const [editingId, setEditingId] = useState(null);
  const scrollAreaRef = useRef(null);
  const lastInputRef = useRef(null);

  useEffect(() => {
    setItems(initialItems || []);
  }, [initialItems]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [items]); // Trigger effect when `items` change
  const mutationScrollerAll = useApiMutation({
    endpoint: `${postDelEditScrolleer}`,
    method: "POST",
    options: {
      onSuccess: (data) => {
        const message = data?.data?.message;
        refetchScroll();
        onOpenChange(false);
        toast({
          title: "Scroller data",
          description: message,
          variant: "success",
        });
      },
      onError: (error) => {
        // const errorMessage = error.response?.data?.message;
        const errorMessage = error.response?.data?.message;
        const errorMessagedec = error.response?.data?.error?.message;
        toast({
          title: errorMessage||"Error",
          description: errorMessagedec ||"Something went wrong.",
          variant: "destructive",
        });
      },
    },
  });
  // Focus on the last input field when a new item is added
  useEffect(() => {
    if (lastInputRef.current) {
      lastInputRef.current.focus();
    }
  }, [items]);

  const addNewItem = () => {
    // Check if the last item is empty
    if (items.length > 0 && items[items.length - 1].text.trim() === "") {
      toast({
        title: "Error",
        description: "Please fill the current field before adding a new one",
        variant: "destructive",
      });
      return; // Do not add a new item if the last one is empty
    }

    const newItem = { id:uuidv4(), text: "" };
    setItems([...items, newItem]);
    setEditingId(newItem.id); // Enable editing for the new item
  };

  const updateItem = (id, text) => {
    setItems(items?.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const deleteItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    // onSave(items.filter(item => item.text.trim() !== ""))
    const fliterData = items
      .filter((item) => item.text.trim() !== "")
      ?.map((item) => item.text);
    // const mydata=fliterData.map(item => item.text)

    // console.log(fliterData, "fliterData");
    const instanceScrollData = JSON.parse(
      sessionStorage.getItem("instanceName")
    );
    const { atemeServerId, backupServiceUID, mainServiceUID } =
      instanceScrollData;
    const serviceUID = mainServiceUID || backupServiceUID;
    const payload = {
      atemeServerId: atemeServerId,
      scrollData: fliterData,
      serviceUID: serviceUID,
    };
    // console.log(payload);
    mutationScrollerAll.mutate({ payload });
  };

  const enableEditing = (id) => {
    setEditingId(id); // Enable editing for the specific item
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] bg-zinc-800 text-white"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Scroll</DialogTitle>
        </DialogHeader>
        <ScrollArea className="space-y-4 max-h-[400px]" ref={scrollAreaRef}>
          {items?.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 py-2">
              <div className="text-sm text-zinc-400 w-16">
                Scroll {index + 1}
              </div>
              <Input
                value={item.text}
                onChange={(e) => updateItem(item.id, e.target.value)}
                className="flex-1 bg-zinc-700 border-zinc-600"
                placeholder="Enter scroll text"
                disabled={editingId !== item.id} // Disable input if not being edited
                ref={index === items.length - 1 ? lastInputRef : null} // Focus on the last input
              />
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => enableEditing(item.id)}
                  className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteItem(item.id)}
                  className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
        <Button
          variant="ghost"
          className="w-full border border-dashed border-zinc-600 hover:border-zinc-500 hover:bg-zinc-700/50"
          onClick={addNewItem}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Scroll
        </Button>
        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button    onClick={handleSave}>{mutationScrollerAll.isPending  ? <LoaderCircle className="animate-spin"/>: "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
