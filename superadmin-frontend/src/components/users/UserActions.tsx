"use client";

import React, { useState } from "react";
import Button from "../ui/button/Button";
import { User } from "../../services/types/user";
import { useAuth } from "../../contexts/AuthContext";
import { EyeIcon, PencilIcon, TrashBinIcon as TrashIcon, UserIcon as UserXIcon, TimeIcon as RefreshCwIcon } from "../../icons";
import ConfirmationDialog from "../common/ConfirmationDialog";

interface UserActionsProps {
  user: User;
  onView: () => void;
  onEdit: () => void;
  onAction: (action: string, userId: string) => void;
}

const UserActions: React.FC<UserActionsProps> = ({
  user,
  onView,
  onEdit,
  onAction,
}) => {
  const { user: currentUser } = useAuth();
  const currentUserRole = currentUser?.userType?.name || "user";

  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: string;
    title: string;
    message: string;
    confirmText: string;
    variant: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    action: "",
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
  });

  const canLogout = ["admin", "manager", "superadmin"].includes(currentUserRole);
  const canDelete = ["admin", "superadmin"].includes(currentUserRole);
  const canHardDelete = currentUserRole === "superadmin";
  const canRecover = currentUserRole === "superadmin";

  // Prevent users from performing actions on themselves
  const isSelfAction = currentUser?.id === user.id;

  const handleActionClick = (action: string) => {
    let title = "";
    let message = "";
    let confirmText = "";
    let variant: "danger" | "warning" | "info" = "danger";

    switch (action) {
      case "delete":
        title = "Delete User";
        message = `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action can be undone by recovering the user.`;
        confirmText = "Delete";
        variant = "danger";
        break;
      case "logout":
        title = "Logout User";
        message = `Are you sure you want to logout ${user.firstName} ${user.lastName}? They will need to login again.`;
        confirmText = "Logout";
        variant = "warning";
        break;
      case "recover":
        title = "Recover User";
        message = `Are you sure you want to recover ${user.firstName} ${user.lastName}? They will be restored to active status.`;
        confirmText = "Recover";
        variant = "info";
        break;
      case "hardDelete":
        title = "Permanently Delete User";
        message = `Are you sure you want to permanently delete ${user.firstName} ${user.lastName}? This action cannot be undone and all data will be lost.`;
        confirmText = "Permanently Delete";
        variant = "danger";
        break;
    }

    setConfirmationDialog({
      isOpen: true,
      action,
      title,
      message,
      confirmText,
      variant,
    });
  };

  const handleConfirmAction = () => {
    onAction(confirmationDialog.action, user.id);
    setConfirmationDialog({ ...confirmationDialog, isOpen: false });
  };

  const handleCloseDialog = () => {
    setConfirmationDialog({ ...confirmationDialog, isOpen: false });
  };

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

      <Button
        size="sm"
        variant="outline"
        onClick={onEdit}
        className="p-2"
      >
        <PencilIcon className="w-4 h-4" />
      </Button>

      {canLogout && user.isActive && !isSelfAction && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleActionClick("logout")}
          className="p-2 text-orange-600 hover:text-orange-700"
        >
          <UserXIcon className="w-4 h-4" />
        </Button>
      )}

      {canDelete && !user.isDeleted && !isSelfAction && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleActionClick("delete")}
          className="p-2 text-red-600 hover:text-red-700"
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      )}

      {canRecover && user.isDeleted && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleActionClick("recover")}
          className="p-2 text-green-600 hover:text-green-700"
        >
          <RefreshCwIcon className="w-4 h-4" />
        </Button>
      )}

      {canHardDelete && user.isDeleted && !isSelfAction && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleActionClick("hardDelete")}
          className="p-2 text-red-800 hover:text-red-900"
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      )}

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={confirmationDialog.confirmText}
        variant={confirmationDialog.variant}
      />
    </div>
  );
};

export default UserActions;