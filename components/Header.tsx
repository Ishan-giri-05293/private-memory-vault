// "use client";

// import { useEffect, useState } from "react";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { auth } from "@/lib/firebase";
// import { usePathname } from "next/navigation";

// export default function Header() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const pathname = usePathname();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       console.log("Auth state changed:", user); // Debugging log
//       setIsLoggedIn(!!user);
//     });

//     return () => unsubscribe();
//   }, []);

//   // Hide Header on the login page
//   if (pathname === "/login") return null;

//   const logout = async () => {
//     await signOut(auth);
//     document.cookie = "firebase-auth=; path=/; max-age=0";
//     window.location.href = "/login";
//   };

//   return (
//     <header className="w-full flex justify-end px-4 py-3 border-b bg-white">
//       {isLoggedIn ? (
//         <button
//           onClick={logout}
//           className="text-sm text-neutral-600 hover:text-black"
//         >
//           Log out
//         </button>
//       ) : (
//         <p className="text-sm text-neutral-600">Checking authentication...</p>
//       )}
//     </header>
//   );
// }
