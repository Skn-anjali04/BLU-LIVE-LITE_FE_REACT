import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const AlertDialogDelete = React.memo(function AlertDialogDelete({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  description = "Are you sure you want to perform this action?",
  confirmText = "Yes",
  cancelText = "Cancel",
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-[#2A2A2A] border-gray-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            className="btn-cancel"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className="btn-save"
            onClick={() => {
              onConfirm();
              onClose(); // Close the dialog
            }}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});


// import React from "react";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";

// export const AlertDialogDelete = React.memo(function AlertDialogDelete({
//   isAlertDeleteOpen,
//   setIsAlertDeleteOpen,
//   setOnDeleteConfirm,
// }) {

//   return (
//     <AlertDialog open={isAlertDeleteOpen} onOpenChange={setIsAlertDeleteOpen}>
//       <AlertDialogContent className="bg-[#2A2A2A] border-gray-800 text-white ">
//         <AlertDialogHeader>
//           <AlertDialogTitle>Delete User</AlertDialogTitle>
//           <AlertDialogDescription>
//             Do you really want to unassign the user from this job?
//           </AlertDialogDescription>
//         </AlertDialogHeader>
//         <AlertDialogFooter>
//           <AlertDialogCancel
//             onClick={() => setIsAlertDeleteOpen(false)}
//             className="btn-cancel"
//           >
//             Cancel
//           </AlertDialogCancel>
//           <AlertDialogAction
//     className="btn-save"
//     onClick={() => {
//       setOnDeleteConfirm(true)
//       setIsAlertDeleteOpen(false); // Close the dialog
//     }}
//   >
//     Yes
//   </AlertDialogAction>
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// });

