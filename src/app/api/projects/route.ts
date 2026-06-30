import { NextRequest, NextResponse } from "next/server";
import { createProject, getProjects } from "@/services/project.service";

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const project = await createProject({
    name: body.name,
    description: body.description,
  });

  return NextResponse.json(project, { status: 201 });
}