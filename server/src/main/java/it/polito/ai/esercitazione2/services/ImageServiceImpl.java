package it.polito.ai.esercitazione2.services;

import it.polito.ai.esercitazione2.entities.Image;
import it.polito.ai.esercitazione2.exceptions.ImageException;
import it.polito.ai.esercitazione2.exceptions.TeamNotFoundException;
import it.polito.ai.esercitazione2.repositories.ImageRepository;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.io.IOException;
import java.util.Optional;

import static it.polito.ai.esercitazione2.services.TeamServiceImpl.compressBytes;
import static it.polito.ai.esercitazione2.services.TeamServiceImpl.decompressBytes;

@Service
@Transactional
@Log(topic = "Image Service")
public class ImageServiceImpl implements ImageService{

    @Autowired
    ImageRepository imageRepository;

    @Override
    public Image getImage(String imageName) {
        final Optional<Image> retrievedImage = imageRepository.findByName(imageName);
        if(!retrievedImage.isPresent())
            return null;
        Image img = retrievedImage.get();
        img.setPicByte(decompressBytes(img.getPicByte()));
        return img;
    }

    @Override
    public Image save(Image img) throws IOException{
        img = imageRepository.save(img);
        return img;
    }
}