import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Formik } from "formik";
import { PASSWORD_REGEX, USEREMAIL_REGEX } from "@/utils/helpers/regex";
import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
import { postaddUserPath } from "@/utils/helpers/api/apiConstant";
import { toast } from "@/hooks/use-toast";
import { encryptPassword } from "@/screens/auth/login/LoginCard";

export function CreateUserDialog({ open, onOpenChange,refetchUsers }) {
  const [showPassword, setShowPassword] = useState(false);
  const formikRef = useRef();
  const mutationCreateUser = useApiMutation({
    endpoint:`${postaddUserPath}`,
    method: "POST",
    options: {
        onSuccess: (data) => {
      const message=data?.data?.message
      refetchUsers()
      if (message) {
        toast({
          title: "User Created",
          description: `${message}`,
          variant: "success",
        });
      }
    },
      onError: (error) => {
       
        const errorMessage = error?.response?.data?.message;
        const errorMessagedec =error?.response?.data?.error?.message;
        toast({
          title: errorMessage ||"Error",
          description: errorMessagedec ||"Something went wrong.",
          variant: "destructive",
        });
    },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2A2A2A] border-gray-800 text-white max-h-[400px] flex flex-col overflow-hidden"
      onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>
        <Formik
          innerRef={formikRef} // Attach ref to Formik
          initialValues={{
            email: "",
            password: "",
            userRole: "",
          }}
          validate={(values) => {
            const errors = {};
            if (!values.email) {
              errors.email = "Email is required.";
            } else if (!USEREMAIL_REGEX.test(values.email)) {
              errors.email =
                "Invalid email format. It must contain end @skandhamss.com.";
            }

            if (!values.userRole) {
              errors.userRole = "Role is required.";
            } else if (values.userRole !== "Operator" && values.userRole !== "Admin"  && values.userRole !== "Tech") {
              errors.userRole = "Invalid role.";
            }

            if (!values.password) {
              errors.password = "Password is required.";
            } else if (!PASSWORD_REGEX.test(values.password)) {
              errors.password =
                "Password must be 8+ charactersnot mor then 15 characters , include uppercase, lowercase, a digit, and a special character.and end with @skandhamss.com";
            }

            return errors;
          }}
          validateOnChange={true}
          onSubmit={(values) => {
            // console.log(values)
            if(values){
             const body= {
                "email": values?.email,
                "password": encryptPassword(values?.password),
                "userRole": values?.userRole?.toLowerCase()
            }
            // console.log(body,"body")
            mutationCreateUser.mutate({payload:body})
            }
            onOpenChange(false); // Close dialog after submission
          }}
        >
          {({ handleChange, handleBlur, values, errors, touched, setFieldValue }) => (
            <form className="flex-1 overflow-y-auto space-y-4 p-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  id="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Username"
                  className={`border ${
                    errors.email && touched.email ? "border-red-500" : ""
                  }`}
                />
                {errors.email && touched.email && (
                  <div className="text-red-500 text-sm">{errors.email}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>User Role</Label>
                <Select
                 className={`border ${errors.userRole && touched.userRole ? "border-red-500" : ""}`}
                  value={values.userRole}
                  onValueChange={(value) => setFieldValue("userRole", value)}
                >
                  <SelectTrigger  className={`border ${errors.userRole && touched.userRole ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-gray-800 text-white">
                    <SelectItem value="Operator">Operator</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Tech">Tech</SelectItem>
                  </SelectContent>
                </Select>
                {errors.userRole && touched.userRole && (
                  <div className="text-red-500 text-sm">{errors.userRole}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={values.password}
                    placeholder="Password"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`bg-transparent pr-10 border ${
                      errors.password && touched.password
                        ? "border-red-500"
                        : ""
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
                {errors.password && touched.password && (
                  <div className="text-red-500 text-sm">{errors.password}</div>
                )}
              </div>

              <DialogFooter>
                <Button variant="cancel_btn" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                {/* Trigger form submission through ref */}
                <Button
                  type="button"
                  onClick={() => formikRef.current.handleSubmit()}
                >
                  Add User
                </Button>
              </DialogFooter>
            </form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}

