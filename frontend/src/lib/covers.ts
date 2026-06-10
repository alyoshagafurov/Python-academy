// Cover artwork per course (served from /public). Falls back to a gradient
// when a course has no image.
export const COURSE_COVERS: Record<string, string> = {
  python_beginner: "/courses/python_beginner.png",
  python_minecraft: "/courses/python_minecraft.png",
  python_student: "/courses/python_student.png",
  web_htmlcss: "/courses/web_htmlcss.png",
  web_python: "/courses/web_python.png",
};

export const courseCover = (id: string): string | undefined => COURSE_COVERS[id];

export const HERO_IMAGE = "/hero.png";
