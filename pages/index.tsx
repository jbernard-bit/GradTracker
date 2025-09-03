import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function Home() {
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    async function testFirestore() {
      try {
        // Add a test application (only if collection is empty)
        const querySnapshot = await getDocs(collection(db, "applications"));
        if (querySnapshot.empty) {
          await addDoc(collection(db, "applications"), {
            jobTitle: "Test Job",
            company: "Test Company",
            status: "applied",
          });
        }

        // Fetch applications
        const apps = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApplications(apps);
      } catch (error) {
        console.error("Error testing Firestore:", error);
      }
    }

    testFirestore();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
        ✅ Tailwind is Working – GradTrack
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {applications.map((app) => (
          <div
            key={app.id}
            className="bg-white shadow-md rounded-lg p-6 border border-gray-200 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold text-gray-800">
              {app.jobTitle}
            </h2>
            <p className="text-gray-600">{app.company}</p>
            <span
              className={`inline-block mt-4 px-3 py-1 text-sm font-medium rounded-full ${
                app.status === "applied"
                  ? "bg-blue-100 text-blue-800"
                  : app.status === "interviewing"
                  ? "bg-yellow-100 text-yellow-800"
                  : app.status === "offer"
                  ? "bg-green-100 text-green-800"
                  : app.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {app.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
