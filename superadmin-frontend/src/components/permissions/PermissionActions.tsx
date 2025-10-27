"use client";

import React, { useState } from "react";
import Button from "../ui/button/Button";
import { CheckCircleIcon } from "../../icons";

interface PermissionActionsProps {
  userId: string;
  moduleId: string;
  hasPermission: boolean;
  onToggle: (userId: string, moduleId: string, hasPermission: boolean) => Promise<void>;
}

const PermissionActions: React.FC<PermissionActionsProps> = ({
  userId,
  moduleId,
  hasPermission,
  onToggle,
}) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggle(userId, moduleId, hasPermission);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <Button
        onClick={handleToggle}
        disabled={loading}
        size="sm"
        variant={hasPermission ? "outline" : "primary"}
        className="min-w-[80px]"
      >
        {loading ? (
          <span className="text-xs">...</span>
        ) : hasPermission ? (
          <div className="flex items-center gap-1">
            <span className="text-xs">Remove</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <CheckCircleIcon className="w-4 h-4" />
            <span className="text-xs">Assign</span>
          </div>
        )}
      </Button>
    </div>
  );
};

export default PermissionActions;