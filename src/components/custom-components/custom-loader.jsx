import { LoaderCircle } from 'lucide-react'
import React from 'react'

const CustomLoader = () => {
  return (
      <div className="h-screen flex justify-center align-middle"><LoaderCircle size={64} className="animate-spin"/></div>
  )
}

export default CustomLoader