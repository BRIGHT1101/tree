import './globals.css';
import localFont from 'next/font/local';

const unzFont = localFont({
  src: '../assets/fonts/unz.ttf',
  display: 'swap',
  variable: '--font-unz',
});

export const metadata = {
  title: '크리스마스 트리 방명록',
  description: '나만의 크리스마스 트리를 만들고 친구들의 메시지를 받아보세요',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={unzFont.variable}>
      <body className={unzFont.className}>{children}</body>
    </html>
  );
}
