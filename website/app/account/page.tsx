"use client";
import React, { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </main>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await user.update({ firstName, lastName });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    
    setDeleting(true);
    try {
      await user.delete();
      router.push("/");
    } catch {
      setMessage({ type: "error", text: "Failed to delete account" });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setPasswordLoading(true);
    try {
      await user.updatePassword({
        currentPassword: user.passwordEnabled ? currentPassword : undefined,
        newPassword: newPassword,
      });
      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordMessage(null);
      }, 1500);
    } catch (err: unknown) {
      const error = err as { errors?: { message?: string }[] };
      setPasswordMessage({ 
        type: "error", 
        text: error.errors?.[0]?.message || "Failed to update password" 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  );

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Account Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your profile and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-3">
              {/* User Info */}
              <div className="flex items-center gap-3 px-3 py-3 mb-2">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0 ring-2 ring-slate-700">
                  {user.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={user.fullName || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.fullName || "User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {primaryEmail?.emailAddress}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all cursor-pointer ${
                    activeTab === "security"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Security
                </button>
              </nav>

              <div className="h-px bg-slate-800/50 my-3"></div>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {activeTab === "profile" && (
              <>
                {/* Profile Form */}
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl">
                  <div className="px-6 py-4 border-b border-slate-800/50">
                    <h2 className="text-sm font-medium text-white">Profile Information</h2>
                  </div>
                  <div className="p-6">
                    {message && (
                      <div
                        className={`mb-4 px-3 py-2 rounded-lg text-xs ${
                          message.type === "success"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {message.text}
                      </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            First name
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder-slate-600"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Last name
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder-slate-600"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Email Addresses */}
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl">
                  <div className="px-6 py-4 border-b border-slate-800/50">
                    <h2 className="text-sm font-medium text-white">Email Addresses</h2>
                  </div>
                  <div className="p-6 space-y-3">
                    {user.emailAddresses.map((email) => (
                      <div
                        key={email.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-slate-300">{email.emailAddress}</span>
                        </div>
                        {email.id === user.primaryEmailAddressId && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl">
                  <div className="px-6 py-4 border-b border-slate-800/50">
                    <h2 className="text-sm font-medium text-white">Connected Accounts</h2>
                  </div>
                  <div className="p-6">
                    {user.externalAccounts.length > 0 ? (
                      <div className="space-y-3">
                        {user.externalAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800/30"
                          >
                            <div className="flex items-center gap-3">
                              {account.provider === "google" && (
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                              )}
                              {account.provider === "github" && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                              )}
                              <div>
                                <span className="text-sm text-slate-300 capitalize">{account.provider}</span>
                                <span className="text-xs text-slate-500 ml-2">{account.emailAddress}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800/50 text-slate-400">
                              Connected
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No connected accounts</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "security" && (
              <>
                {/* Password */}
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl">
                  <div className="px-6 py-4 border-b border-slate-800/50">
                    <h2 className="text-sm font-medium text-white">Password</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800/30">
                      <div className="flex items-center gap-3">
                        {user.passwordEnabled ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        <span className="text-sm text-slate-300">
                          {user.passwordEnabled ? "Password is set" : "No password (social login)"}
                        </span>
                      </div>
                      <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        {user.passwordEnabled ? "Change" : "Set password"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl">
                  <div className="px-6 py-4 border-b border-slate-800/50">
                    <h2 className="text-sm font-medium text-white">Active Sessions</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800/30">
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <span className="text-sm text-slate-300">Current session</span>
                          <span className="text-xs text-slate-500 ml-2">This device</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-slate-900/50 border border-emerald-900/30 rounded-xl">
                  <div className="px-6 py-4 border-b border-emerald-900/30">
                    <h2 className="text-sm font-medium text-emerald-400">Danger Zone</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-300">Delete account</p>
                        <p className="text-xs text-slate-500 mt-0.5">Permanently delete your account and all data</p>
                      </div>
                      <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Account</h3>
            <p className="text-sm text-slate-400 mb-4">
              This action is permanent and cannot be undone. All your data will be deleted.
            </p>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Type <span className="text-emerald-400 font-mono">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder-slate-600"
                placeholder="DELETE"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowPasswordModal(false);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setPasswordMessage(null);
            }}
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              {user.passwordEnabled ? "Change Password" : "Set Password"}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {user.passwordEnabled 
                ? "Enter your current password and choose a new one." 
                : "Create a password for your account."}
            </p>

            {passwordMessage && (
              <div
                className={`mb-4 px-3 py-2 rounded-lg text-xs ${
                  passwordMessage.type === "success"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {passwordMessage.text}
              </div>
            )}
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {user.passwordEnabled && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder-slate-600"
                    placeholder="Enter current password"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder-slate-600"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder-slate-600"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordMessage(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
