"use client";

import React from "react";
import Button from "../ui/button/Button";
import { Module } from "../../services/types/module";
import { useAuth } from "../../contexts/AuthContext";
import { EyeIcon, PencilIcon, TrashBinIcon as TrashIcon, DeleteIcon } from "../../icons";

interface ModuleActionsProps {
   module: Module;
   onView: () => void;
   onEdit: () => void;
   onDelete?: () => void;
   onAction: (action: string, moduleId: string) => void;
 }

const ModuleActions: React.FC<ModuleActionsProps> = ({
   module,
   onView,
   onEdit,
   onDelete,
   onAction,
 }) => {
  const { user: currentUser } = useAuth();
  const currentUserRole = currentUser?.userType?.name || "user";

  const canEdit = ["admin", "superadmin"].includes(currentUserRole);
  const canDeactivate = ["admin", "superadmin"].includes(currentUserRole);
  const canDelete = ["superadmin"].includes(currentUserRole); // Only superadmin can hard delete

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onView}
        className="p-2"
      >
        <EyeIcon className="w-4 h-4" />
      </Button>

      {canEdit && (
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="p-2"
        >
          <PencilIcon className="w-4 h-4" />
        </Button>
      )}

      {canDeactivate && module.isActive && (
         <Button
           size="sm"
           variant="outline"
           onClick={() => onAction("deactivate", module.id)}
           className="p-2 text-red-600 hover:text-red-700"
         >
           <TrashIcon className="w-4 h-4" />
         </Button>
       )}

       {canDelete && onDelete && (
         <Button
           size="sm"
           variant="outline"
           onClick={onDelete}
           className="p-2 text-red-800 hover:text-red-900"
         >
           <DeleteIcon className="w-4 h-4" />
         </Button>
       )}
    </div>
  );
};

export default ModuleActions;