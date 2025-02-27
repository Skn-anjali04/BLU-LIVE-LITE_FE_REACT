// import { Eye, EyeOff } from 'lucide-react'
// import { Input } from "@/components/ui/input"
import appLogo from "@/assets/images/app-white-logo.png";
import footerLogo from "@/assets/images/app-white-logo-footer.png";
import LoginCard from "./LoginCard";
const Login = () => {

  return (
  
      // <div className="min-h-screen flex flex-col items-center justify-center bg-[url('./assets/images/bg-image.jpg')] bg-blend-overlay">
        
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat bg-[url('./assets/images/bg-image.jpg')] bg-blend-overlay">
        {/* Logo Section */}
        <div className="mb-8 relative">
          <img src={appLogo} width={200} height={60} alt="app-logo" />
          <span className="text-white/80 text-sm font-bold absolute top-[4.75rem] right-[-1.5rem]">
            v 1.1
          </span>
        </div>
        
        <LoginCard/>
        {/* Watermark */}
        <div className="fixed bottom-4 right-4">
          <img
          src={footerLogo}
          alt="Watermark"
          width={100}
          height={40}
        />
        </div>
     
      </div>
   
  );
};

export default Login;
