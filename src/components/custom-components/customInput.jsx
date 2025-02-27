import { useState, memo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label"; // Adjust according to your components' import

export const PasswordInput = memo(({
  id,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{placeholder}</Label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`bg-transparent pr-10 border ${
            error && touched ? "border-red-500" : ""
          }`}
        />
        <span
          className="absolute right-0 top-0 h-full px-3 py-2 cursor-pointer"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </span>
      </div>
      {error && touched && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
});

// export default PasswordInput;
