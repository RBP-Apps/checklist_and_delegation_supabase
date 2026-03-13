import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../SupabaseClient";

const RealtimeLogoutListener = () => {
  const navigate = useNavigate();

  // ✅ Ask notification permission
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // ✅ User auto-logout listener (for current user)
  useEffect(() => {
    let subscription;
    const username = localStorage.getItem("user-name");
    if (!username) return;

    subscription = supabase
      .channel("user-status-watch")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `user_name=eq.${username}`,
        },
        (payload) => {
          const updatedUser = payload.new;
          if (updatedUser.status !== "active") {
            // Show Chrome notification to user
            if (Notification.permission === "granted") {
              new Notification("Account Deactivated", {
                body: "Your account has been deactivated. You have been logged out.",
                icon: "/logo.png",
              });
            }

            localStorage.clear();
            navigate("/login");
            window.location.reload();
          }
        }
      )
      .subscribe();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [navigate]);

  // ✅ Admin listener to see logout notifications
useEffect(() => {
  const role = localStorage.getItem("role");
  if (role !== "admin") return;

  const adminSubscription = supabase
    .channel("admin-user-status-watch")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "users",
      },
      (payload) => {
        const updatedUser = payload.new;
        const previousUser = payload.old;

        if (previousUser?.status === "active" && updatedUser?.status === "inactive") {
          if (Notification.permission === "granted") {
            new Notification("User Logged Out", {
              body: `User "${updatedUser.user_name}" has been logged out.`,
              icon: "/logo.png",
            });
          }
        }
      }
    )

  return () => {
    supabase.removeChannel(adminSubscription);
  };
}, []);


  // ✅ Check user status on refresh
  useEffect(() => {
    const checkUserStatusOnLoad = async () => {
      const username = localStorage.getItem("user-name");
      if (!username) return;

      const { data } = await supabase
        .from("users")
        .select("status")
        .eq("user_name", username)
        .single();

      if (!data || data.status !== "active") {
        localStorage.clear();
        navigate("/login");
        window.location.reload();
      }
    };

    checkUserStatusOnLoad();
  }, [navigate]);

  return null;
};

export default RealtimeLogoutListener;
