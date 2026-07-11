import clsx from 'clsx';
import { useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react';

type FadeInImageProps = ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
};

export function FadeInImage({
    className,
    src,
    alt,
    onLoad,
    onError,
    loading = 'lazy',
    decoding = 'async',
    ...props
}: FadeInImageProps) {
    const [visible, setVisible] = useState(false);

    function reveal() {
        setVisible(true);
    }

    function handleLoad(event: SyntheticEvent<HTMLImageElement>) {
        reveal();
        onLoad?.(event);
    }

    function handleError(event: SyntheticEvent<HTMLImageElement>) {
        reveal();
        onError?.(event);
    }

    return (
        <img
            key={src}
            src={src}
            alt={alt}
            loading={loading}
            decoding={decoding}
            onLoad={handleLoad}
            onError={handleError}
            ref={(image) => {
                if (image !== null && image.complete && image.naturalWidth > 0) {
                    reveal();
                }
            }}
            className={clsx(
                'transition-opacity duration-200 ease-out',
                visible ? 'opacity-100' : 'opacity-0',
                className
            )}
            {...props}
        />
    );
}
