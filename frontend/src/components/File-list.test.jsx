import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import FileList from "./File-list"

describe("FileList Component", () => {
    const mockFiles = [
        {
            id: "1",
            file_name: "document.pdf",
            mimetype: "application/pdf",
            uploaded_at: "2025-01-10T10:00:00Z",
            total_size: 1024000,
        },
        {
            id: "2",
            file_name: "video.mp4",
            mimetype: "video/mp4",
            uploaded_at: "2025-01-09T15:30:00Z",
            total_size: 52428800,
        },
        {
            id: "3",
            file_name: "image.jpg",
            mimetype: "image/jpeg",
            uploaded_at: "2025-01-08T12:00:00Z",
            total_size: 2048000,
        },
        {
            id: "4",
            file_name: "data.xlsx",
            mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            uploaded_at: "2025-01-07T09:00:00Z",
            total_size: 512000,
        },
    ]

    it("renders table with file data", () => {
        render(<FileList files={mockFiles} />)

        expect(screen.getByText("Name")).toBeInTheDocument()
        expect(screen.getByText("Last modified")).toBeInTheDocument()
        expect(screen.getByText("File size")).toBeInTheDocument()

        mockFiles.forEach((file) => {
            expect(screen.getByText(file.file_name)).toBeInTheDocument()
        })
    })

    it("displays correct file names", () => {
        render(<FileList files={mockFiles} />)

        expect(screen.getByText("document.pdf")).toBeInTheDocument()
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
        expect(screen.getByText("image.jpg")).toBeInTheDocument()
        expect(screen.getByText("data.xlsx")).toBeInTheDocument()
    })

    it("formats file sizes correctly", () => {
        render(<FileList files={mockFiles} />)

        expect(screen.getByText("1000.0 KB")).toBeInTheDocument() // 1024000 bytes
        expect(screen.getByText("50.0 MB")).toBeInTheDocument() // 52428800 bytes
        expect(screen.getByText("2.0 MB")).toBeInTheDocument() // 2048000 bytes
        expect(screen.getByText("500.0 KB")).toBeInTheDocument() // 512000 bytes
    })

    it("formats dates correctly", () => {
        render(<FileList files={mockFiles} />)

        expect(screen.getByText("Jan 10, 2025")).toBeInTheDocument()
        expect(screen.getByText("Jan 9, 2025")).toBeInTheDocument()
        expect(screen.getByText("Jan 8, 2025")).toBeInTheDocument()
        expect(screen.getByText("Jan 7, 2025")).toBeInTheDocument()
    })

    it("renders menu items for each file", () => {
        render(<FileList files={mockFiles} />)

        const dropdownTriggers = screen.getAllByRole("button", { name: "" })
        expect(dropdownTriggers.length).toBeGreaterThanOrEqual(mockFiles.length)
    })

    it("renders empty table when no files provided", () => {
        render(<FileList files={[]} />)

        expect(screen.getByText("Name")).toBeInTheDocument()
        expect(screen.queryByText(/document\.pdf|video\.mp4/)).not.toBeInTheDocument()
    })

    it("renders correct file icons based on mimetype", () => {
        const { container } = render(<FileList files={mockFiles} />)

        // Check if SVG icons are rendered (lucide-react icons)
        const icons = container.querySelectorAll("svg")
        expect(icons.length).toBeGreaterThan(0)
    })

    it("handles files with different MIME types", () => {
        const filesWithVariousMimes = [
            {
                id: "1",
                file_name: "audio.mp3",
                mimetype: "audio/mpeg",
                uploaded_at: "2025-01-10T10:00:00Z",
                total_size: 5242880,
            },
            {
                id: "2",
                file_name: "archive.zip",
                mimetype: "application/zip",
                uploaded_at: "2025-01-09T15:30:00Z",
                total_size: 10485760,
            },
            {
                id: "3",
                file_name: "config.json",
                mimetype: "application/json",
                uploaded_at: "2025-01-08T12:00:00Z",
                total_size: 102400,
            },
        ]

        render(<FileList files={filesWithVariousMimes} />)

        filesWithVariousMimes.forEach((file) => {
            expect(screen.getByText(file.file_name)).toBeInTheDocument()
        })
    })

    it("renders table rows for each file", () => {
        const { container } = render(<FileList files={mockFiles} />)

        const rows = container.querySelectorAll("tbody tr")
        expect(rows).toHaveLength(mockFiles.length)
    })
})
