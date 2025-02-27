import { useEffect, useState } from "react";

export const TimerComponent = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
  
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
  
      return () => clearInterval(timer); // Cleanup on component unmount
    }, []);
  
    return (
      <div className="text-4xl font-mono text-red-400 mb-2">
        {currentTime.toLocaleTimeString()}
        <div className="text-lg text-white font-mono">
        {currentTime
  .toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  .replace(/,/g, "")}

        </div>
      </div>
    );
  };