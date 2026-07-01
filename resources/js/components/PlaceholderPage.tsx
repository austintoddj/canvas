import { Heading } from '@/components/heading';
import { Text } from '@/components/text';

type PlaceholderPageProps = {
    title: string;
    description?: string;
};

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
    return (
        <div className="p-8">
            <Heading>{title}</Heading>
            {description ? <Text className="mt-2 text-zinc-500">{description}</Text> : null}
        </div>
    );
}
