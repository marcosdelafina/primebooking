"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SparklesTextProps {
    /**
     * @default "Sparkles Text"
     * @type React.ReactNode
     * @description The content to be displayed
     */
    children: React.ReactNode;

    /**
     * @default ""
     * @type string
     * @description The className to be passed to the component
     */
    className?: string;

    /**
     * @default 10
     * @type number
     * @description The number of sparkles to be displayed
     */
    sparklesCount?: number;

    /**
     * @default "{ first: '#A07CFE', second: '#FE8FB5' }"
     * @type object
     * @description The colors of the sparkles
     */
    colors?: {
        first: string;
        second: string;
    };
}

interface SparkleProps {
    id: string;
    x: string;
    y: string;
    color: string;
    delay: number;
    scale: number;
    lifespan: number;
}

const Sparkle = ({ id, x, y, color, delay, scale, lifespan }: SparkleProps) => (
    <motion.svg
        key={id}
        className="absolute z-0 pointer-events-none"
        initial={{ opacity: 0, scale: 0, rotate: 0 }}
        animate={{
            opacity: [0, 1, 0],
            scale: [0, scale, 0],
            rotate: [0, 45, 90],
        }}
        transition={{
            duration: lifespan,
            delay: delay,
            ease: "easeInOut",
        }}
        style={{
            left: x,
            top: y,
        }}
        width="21"
        height="21"
        viewBox="0 0 21 21"
    >
        <path
            d="M10.5 0C10.5 5.79899 15.201 10.5 21 10.5C15.201 10.5 10.5 15.201 10.5 21C10.5 15.201 5.79899 10.5 0 10.5C5.79899 10.5 10.5 5.79899 10.5 0Z"
            fill={color}
        />
    </motion.svg>
);

export const SparklesText: React.FC<SparklesTextProps> = ({
    children,
    className,
    sparklesCount = 10,
    colors = { first: "#A07CFE", second: "#FE8FB5" },
}) => {
    const [sparkles, setSparkles] = useState<SparkleProps[]>([]);

    useEffect(() => {
        const generateSparkle = () => {
            const sparkle: SparkleProps = {
                id: Math.random().toString(36).substring(2),
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                color: Math.random() > 0.5 ? colors.first : colors.second,
                delay: Math.random() * 2,
                scale: Math.random() * 0.7 + 0.3,
                lifespan: Math.random() * 2 + 1,
            };
            return sparkle;
        };

        const initialSparkles = Array.from({ length: sparklesCount }, generateSparkle);
        setSparkles(initialSparkles);

        const interval = setInterval(() => {
            setSparkles((prevSparkles) => {
                const nextSparkles = [...prevSparkles];
                const indexToReplace = Math.floor(Math.random() * nextSparkles.length);
                nextSparkles[indexToReplace] = generateSparkle();
                return nextSparkles;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [sparklesCount, colors.first, colors.second]);

    return (
        <div className={cn("relative inline-block", className)}>
            <AnimatePresence>
                {sparkles.map((sparkle) => (
                    <Sparkle key={sparkle.id} {...sparkle} />
                ))}
            </AnimatePresence>
            <span className="relative z-10">{children}</span>
        </div>
    );
};
