import { useState, useEffect, useCallback } from "react";

export default function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/students/");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, loading, refresh: fetchStudents };
}
