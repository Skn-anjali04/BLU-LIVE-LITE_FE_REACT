import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Formik, Form } from "formik";
import { PASSWORD_REGEX, USEREMAIL_REGEX, USERNAME_REGEX } from "@/utils/helpers/regex";
import { setTokens } from "@/utils/helpers/auth/authService";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
import { getLoginPath } from "@/utils/helpers/api/apiConstant";
import forge from 'node-forge';
import { encryptData } from "@/utils/helpers/auth/encrypt-decrypt";
const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBITANBgkqhkiG9w0BAQEFAAOCAQ4AMIIBCQKCAQB3QOS0UpIZnW+f50H+09cx
012xPfBetjvp9UyTvxT8IdKsAk+86K/3rtH4BTHflvRxbVdWARUSGEbpvds4jnoa
jXd3IQf510lPAG7mRc0Y6k5iZ7tAHw/05r2FSgk2j7VCHpkNg7ahBROsJxT4UeyG
kDlykW35NsVfxOJsYARpKCsw2hsVBFoMNwNT8q7f02PDYBYtxJZfJUKnWhgXOR+/
lLJLXNfGHre2e7iIH2AKxeOODhZA/Q5nRcjT5uJssj8Ccj7TPkYHcvOu0GNZDu4y
teFPf5qCctrgxBWm+SBnGfxrYr+VoL/cxkIwQevKrD0ygcJ5lqo1ik4COq9tgo7t
AgMBAAE=
-----END PUBLIC KEY-----`

export function encryptPassword(password) {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem)
  const encrypted = publicKey.encrypt(password, 'RSA-OAEP', {
    md: forge.md.sha1.create(),
    mgf1: forge.mgf.mgf1.create(forge.md.sha1.create()),
  })

  return forge.util.encode64(encrypted)
}

const LoginCard = () => {
  const [showPassword, setShowPassword] = useState(false);
    const [emailUser, setEmailUser] = useState();
  const navigate = useNavigate();
  const { toast } = useToast()
  
  const mutationLogin = useApiMutation({
    endpoint:`${getLoginPath}`,
    method: "POST",
    options: {
      // retry: false,
    onSuccess: (data) => {
      const token = data?.data?.data?.accessToken;
      const userRole = data?.data?.data?.userRole;
      const message = data?.data?.message;
    // console.log(data?.data?.data,"data?.data?.data?11loging")
      if (token && userRole && message) {
        setTokens({ accessToken: token, userRole: userRole });
        // Navigate based on user role
        if (["admin", "tech"].includes(userRole.toLowerCase())) {
          navigate("/admin-panel");
        } else {
          navigate("/lobby");
        }
        
        sessionStorage.setItem("user",emailUser)
        toast({
          title: "Login",
          description: `${message}`,
          variant: "success",
        });
      }
    },
    
    onError: (error) => {
      // console.log(error,"ssssssss")
      const errorMessage = error.response?.data?.message;
      const errorMessagedec =error.response?.data?.error?.message;
      toast({
        title: errorMessage ||"Login",
        description:errorMessagedec||"something want Wrong",
        variant: "destructive",
      });
    },
    },
    
  });
  
  return (
    <div>
      <Card className="w-[450px] max-w-sm bg-neutral-700 border-none">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-white">Login</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <Formik
            initialValues={{ email: "", password: "" }}
            validate={(values) => {
              const errors = {};
              if (!values.email) {
                errors.email = "Email is required.";
              } else if (!USEREMAIL_REGEX.test(values.email)) {
                errors.email = "Invalid email provided!";
              }

              if (!values.password) {
                errors.password = "Password is required.";
              } else if (!PASSWORD_REGEX.test(values.password)) {
                errors.password =
                  "Password must be 4+ characters, include uppercase, lowercase, a digit, and a special character.";
              }

              return errors;
            }}
            onSubmit={(values) => {
              
              setEmailUser(encryptData(values.email))
              // mutationLogin.mutate(values);
              const body= {
                "email": values.email,
                "password":encryptPassword( values.password)
              }
              mutationLogin.mutate(
                {
                  payload: body
                }
              );
            }}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              errors,
              touched,
              values,
            }) => (
              <Form
                className="space-y-4"
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                <div>
                  <Input
                    type="text"
                    name="email"
                    placeholder="Username"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="bg-transparent border-0 border-b-2 border-white rounded-none px-0 h-12 text-white font-medium focus-visible:border-white focus-visible:ring-0 placeholder-red-500"
                  />
                  {errors.email && touched.email && (
                    <div className="text-red-500 text-sm font-medium mt-1">
                      {errors.email}
                    </div>
                  )}
                </div>

               
                <div className="space-y-1">
                  <div className="flex items-center gap-3 border-b-2 border-white">
                    <div className="flex-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="bg-transparent border-0 rounded-none px-0 h-12 text-white font-medium focus-visible:ring-0 placeholder-red-500"
                      />
                    </div>
                    <div
                      onClick={() => setShowPassword(!showPassword)}
                      className="cursor-pointer text-white hover:text-white"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  {errors.password && touched.password && (
                    <div className="text-red-500 text-sm font-bold mt-1">
                      {errors.password}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    // className="bg-zinc-400 hover:bg-zinc-500 text-zinc-900 px-8"
                    type="submit"
                    disabled={
                      !values.email ||
                      !values.password ||
                      Object.keys(errors).length > 0 ||
                      mutationLogin.isPending 
                    }
                  >
                    {mutationLogin.isPending  ? <LoaderCircle className="animate-spin"/>: "Submit"}
                  </Button>
                  
                </div>
               
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginCard;
