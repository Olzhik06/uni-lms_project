import { redirect } from 'next/navigation';
export default function P({ params }: { params: { id: string } }) { redirect(`/courses/${params.id}/overview`); }
